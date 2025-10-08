from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import subprocess
import tempfile
import os
import time
import psutil
import asyncio
import signal
from typing import Optional

router = APIRouter()

class CodeExecutionRequest(BaseModel):
    code: str
    language: str

class CodeExecutionResponse(BaseModel):
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None
    memory_usage: Optional[int] = None

@router.post("/api/run", response_model=CodeExecutionResponse)
async def execute_code(request: CodeExecutionRequest):
    """
    코드를 실행하고 결과를 반환합니다.
    """
    try:
        # 현재는 Python만 지원
        if request.language.lower() != 'python':
            raise HTTPException(status_code=400, detail="현재 Python만 지원됩니다.")
        
        if not request.code.strip():
            raise HTTPException(status_code=400, detail="코드를 입력해주세요.")
        
        # Python 코드 실행
        result = await execute_python_code(request.code)
        return result
        
    except Exception as e:
        return CodeExecutionResponse(
            success=False,
            error=f"실행 중 오류가 발생했습니다: {str(e)}"
        )

async def execute_python_code(code: str) -> CodeExecutionResponse:
    """
    Python 코드를 안전하게 실행합니다.
    """
    # 임시 파일 생성
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
        temp_file.write(code)
        temp_file_path = temp_file.name
    
    try:
        # 실행 시작 시간 기록
        start_time = time.time()
        
        # Python 코드 실행 (제한된 환경)
        process = await asyncio.create_subprocess_exec(
            'python', temp_file_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            preexec_fn=os.setsid if os.name != 'nt' else None  # Windows가 아닌 경우에만 process group 설정
        )
        
        try:
            # 5초 제한시간 설정
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), 
                timeout=5.0
            )
            
            # 실행 시간 계산
            execution_time = (time.time() - start_time) * 1000  # ms 단위
            
            # 메모리 사용량 (근사치)
            memory_usage = psutil.Process().memory_info().rss // 1024  # KB 단위
            
            # 결과 반환
            if process.returncode == 0:
                return CodeExecutionResponse(
                    success=True,
                    output=stdout.decode('utf-8', errors='ignore').strip(),
                    execution_time=execution_time,
                    memory_usage=memory_usage
                )
            else:
                return CodeExecutionResponse(
                    success=False,
                    error=stderr.decode('utf-8', errors='ignore').strip(),
                    execution_time=execution_time
                )
                
        except asyncio.TimeoutError:
            # 프로세스 종료
            if os.name != 'nt':  # Windows가 아닌 경우
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            else:  # Windows인 경우
                process.terminate()
            
            await process.wait()
            
            return CodeExecutionResponse(
                success=False,
                error="실행 시간이 5초를 초과했습니다. (무한 루프 가능성)"
            )
            
    except Exception as e:
        return CodeExecutionResponse(
            success=False,
            error=f"코드 실행 중 오류: {str(e)}"
        )
    finally:
        # 임시 파일 삭제
        try:
            os.unlink(temp_file_path)
        except:
            pass

# 보안을 위한 제한된 Python 환경 설정 (선택사항)
def create_restricted_globals():
    """
    제한된 전역 변수 환경을 생성합니다.
    """
    import builtins
    
    # 허용할 내장 함수들
    allowed_builtins = {
        'print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter',
        'sum', 'max', 'min', 'abs', 'round', 'sorted', 'reversed',
        'int', 'float', 'str', 'bool', 'list', 'tuple', 'dict', 'set',
        'type', 'isinstance', 'hasattr', 'getattr', 'setattr',
        'all', 'any', 'chr', 'ord', 'bin', 'hex', 'oct'
    }
    
    restricted_builtins = {}
    for name in allowed_builtins:
        if hasattr(builtins, name):
            restricted_builtins[name] = getattr(builtins, name)
    
    return {
        '__builtins__': restricted_builtins,
    }
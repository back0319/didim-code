#!/usr/bin/env ruby

require "csv"
require "json"
require "open3"
require "pathname"
require "time"

SOURCE_FILES = %w[problems.csv exemplars.csv test_cases.csv feedbacks.csv].freeze

def read_csv(zip_path, filename)
  output, error, status = Open3.capture3("unzip", "-p", zip_path, filename)
  abort("#{filename} 읽기 실패: #{error}") unless status.success?

  CSV.parse(output, headers: true).map(&:to_h)
end

def null_value(value)
  return nil if value.nil? || value == "NULL"

  value
end

def integer(value)
  null_value(value)&.to_i
end

def number(value)
  null_value(value)&.to_f
end

def postgres_array(value)
  value = null_value(value)
  return [] unless value

  inner = value.delete_prefix("{").delete_suffix("}")
  CSV.parse_line(inner)&.map(&:strip)&.reject(&:empty?) || []
end

def json_array(value)
  value = null_value(value)
  return [] unless value

  JSON.parse(value)
rescue JSON::ParserError
  []
end

zip_path = File.expand_path(ARGV[0] || "")
abort("사용법: ruby scripts/convert-csv.rb <cs-database.zip> [output.json]") unless File.file?(zip_path)

output_path = Pathname.new(ARGV[1] || File.join(__dir__, "..", "data", "catalog.json")).expand_path
rows = SOURCE_FILES.to_h { |filename| [filename, read_csv(zip_path, filename)] }

catalog = {
  "generated_at" => Time.now.utc.iso8601,
  "source" => File.basename(zip_path),
  "problems" => rows["problems.csv"].map do |row|
    {
      "id" => integer(row["id"]),
      "title" => row["title"],
      "description" => row["description"],
      "difficulty" => row["difficulty"],
      "paradigms" => postgres_array(row["paradigms"]),
      "expected_complexity" => row["expected_complexity"],
      "created_at" => row["created_at"],
      "category" => null_value(row["category"]),
      "input" => null_value(row["input"]),
      "output" => null_value(row["output"]),
      "test_cases" => json_array(row["test_cases"])
    }
  end,
  "exemplars" => rows["exemplars.csv"].map do |row|
    {
      "id" => integer(row["id"]),
      "problem_id" => integer(row["problem_id"]),
      "type" => row["type"],
      "code" => row["code"],
      "complexity" => row["complexity"],
      "explanation" => null_value(row["explanation"]),
      "created_at" => row["created_at"]
    }
  end,
  "test_cases" => rows["test_cases.csv"].map do |row|
    {
      "id" => integer(row["id"]),
      "problem_id" => integer(row["problem_id"]),
      "case_number" => integer(row["case_number"]),
      "input_data" => row["input_data"],
      "expected_output" => row["expected_output"],
      "is_sample" => row["is_sample"] == "True",
      "time_limit" => number(row["time_limit"]),
      "memory_limit" => integer(row["memory_limit"]),
      "score" => number(row["score"]),
      "created_at" => row["created_at"]
    }
  end,
  "feedbacks" => rows["feedbacks.csv"].map do |row|
    {
      "id" => integer(row["id"]),
      "submission_id" => integer(row["submission_id"]),
      "type" => row["type"],
      "title" => row["title"],
      "message" => row["message"],
      "severity" => row["severity"],
      "code_suggestion" => null_value(row["code_suggestion"]),
      "created_at" => row["created_at"],
      "priority" => integer(row["priority"])
    }
  end
}

output_path.dirname.mkpath
output_path.write(JSON.pretty_generate(catalog) + "\n")

puts "변환 완료: #{output_path}"
SOURCE_FILES.each do |filename|
  puts "- #{filename}: #{rows[filename].length}행"
end

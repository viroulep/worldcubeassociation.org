# frozen_string_literal: true

class ConciseAverageResult < ApplicationRecord
  RESULT_ROW_MASK=1_000_000_000
  self.table_name = "ConciseAverageResults"

  def self.to_result_id(valueAndId)
    valueAndId - (valueAndId / RESULT_ROW_MASK) * RESULT_ROW_MASK
  end
end

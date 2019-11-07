# frozen_string_literal: true

class Permission < ApplicationRecord
  belongs_to :entity, polymorphic: true
end

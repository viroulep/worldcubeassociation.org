# frozen_string_literal: true

module ControllerParams
  class RecordsShow
    # Represent the "show" parameter in records views
    KINDS = %w(mixed slim separate history mixed\ history).freeze
    attr_reader :kind

    def initialize(kind)
      kind ||= "mixed"
      @kind = kind
    end

    def valid?
      KINDS.include?(@kind)
    end

    def mixed?
      @kind == "mixed"
    end

    def slim?
      @kind == "slim"
    end

    def separate?
      @kind == "separate"
    end

    def history?
      @kind == "history"
    end

    def mixed_history?
      @kind == "mixed history"
    end

    def any_history?
      history? || mixed_history?
    end

    def self.all
      KINDS
    end
  end
end

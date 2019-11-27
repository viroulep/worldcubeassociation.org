# frozen_string_literal: true

module ControllerParams
  class Year
    # Represent the "year" parameter in records/rankings views
    attr_reader :year

    def initialize(year_str)
      year_str ||= "all years"
      @all = year_str == "all years"
      splitted_years_param = year_str.split
      @only = splitted_years_param[0] == "only"
      @until = splitted_years_param[0] == "until"
      if @only || @until
        @year = splitted_years_param[1].to_i
      else
        @year = nil
      end
    end

    def valid?
      all? || until? || only?
    end

    def all?
      @all
    end

    def until?
      @until
    end

    def only?
      @only
    end

    def self.all
      Competition.non_future_years.freeze
    end
  end
end

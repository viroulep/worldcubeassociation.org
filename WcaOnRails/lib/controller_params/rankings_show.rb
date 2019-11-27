# frozen_string_literal: true

module ControllerParams
  class RankingsShow
    # Represent the "show" parameter in rankings views
    KINDS = %w(by\ region persons results).freeze

    def initialize(show)
      show ||= "100 persons"
      # TODO: validate inclusion in ?
      @show = show
      @n = 0
      unless @show == "by region"
        splitted = @show.split
        @n = splitted[0].to_i
        @show = splitted[1]
      end
    end

    def valid?
      region? || (@n >= 0 && (persons? || results?))
    end

    def persons?
      @show == "persons"
    end

    def results?
      @show == "results"
    end

    def region?
      @show == "by region"
    end

    def limit
      @n
    end

    def self.all
      KINDS
    end
  end
end

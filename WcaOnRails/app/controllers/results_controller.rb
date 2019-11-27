# frozen_string_literal: true

class ResultsController < ApplicationController
  before_action :support_old_links!, only: [:rankings, :records]
  before_action :set_year_param!, only: [:rankings, :records]
  before_action :set_record_view!, only: [:records]
  before_action :set_ranking_view!, only: [:rankings]
  before_action :set_type!, only: [:rankings]

  TYPE = ["single", "average"].freeze
  QUANTITIES = ["100", "1000"].freeze

  def rankings
    # Default params
    params[:region] ||= "world"
    params[:years] ||= "all years"
    params[:show] ||= "100 persons"

    shared_constants_and_conditions

    @quantities = ["100", "1000"]

    value = @rank_type.value
    capitalized_type_param = @rank_type.capitalized

    @limit = @ranking_view.limit
    limit_condition = "LIMIT #{@limit}"

    if @ranking_view.persons?
      @query = <<-SQL
        SELECT
          result.*,
          result.#{value} value
        FROM (
          SELECT MIN(valueAndId) valueAndId
          FROM Concise#{capitalized_type_param}Results result
          WHERE 1
            #{@event_condition}
            AND #{value} > 0
            #{@years_condition}
            #{@region_condition}
          GROUP BY personId
          ORDER BY valueAndId
          #{limit_condition}
        ) top
        JOIN Results result ON result.id = valueAndId % 1000000000
        ORDER BY value, personName
      SQL
    elsif @ranking_view.results?
      if @is_average
        subquery = <<-SQL
          SELECT
            result.*,
            average value
          FROM Results result
          #{@years_condition.present? ? "JOIN Competitions competition on competition.id = competitionId" : ""}
          WHERE 1
            #{@event_condition}
            AND average > 0
            #{@years_condition}
            #{@region_condition}
          ORDER BY
            average
          #{limit_condition}
        SQL
        @query = <<-SQL
          SELECT *
          FROM (#{subquery}) result
          ORDER BY average, personName, competitionId, roundTypeId
        SQL
      else
        subqueries = (1..5).map do |i|
          <<-SQL
            SELECT
              result.*,
              value#{i} value
            FROM Results result
            #{@years_condition.present? ? "JOIN Competitions competition on competition.id = competitionId" : ""}
            WHERE 1
              #{@event_condition}
              AND value#{i} > 0
              #{@years_condition}
              #{@region_condition}
            ORDER BY value
            #{limit_condition}
          SQL
        end
        subquery = "(" + subqueries.join(") UNION ALL (") + ")"
        @query = <<-SQL
          SELECT *
          FROM (#{subquery}) result
          ORDER BY value, personName, competitionId, roundTypeId
          #{limit_condition}
        SQL
      end
    elsif @ranking_view.region?
      @query = <<-SQL
        SELECT
          result.*,
          result.#{value} value
        FROM (
          SELECT
            countryId recordCountryId,
            MIN(#{value}) recordValue
          FROM Concise#{capitalized_type_param}Results result
          WHERE 1
            #{@event_condition}
            #{@years_condition}
          GROUP BY countryId
        ) record
        JOIN Results result ON result.#{value} = recordValue AND result.countryId = recordCountryId
        JOIN Competitions competition on competition.id = competitionId
        WHERE 1
          #{@event_condition}
          #{@years_condition}
        ORDER BY value, countryId, start_date, personName
      SQL
    else
      flash[:danger] = t(".unknown_show")
      return redirect_to rankings_path
    end
  end

  def records
    # Default params
    params[:event_id] ||= "all events"
    params[:region] ||= "world"

    events, countries, @record_names = restrictions_from_params

    scope_with_restrictions = lambda do |base|
      if @year_param.until?
        base = base.where("year < ?", @year_param.year)
      end
      if @year_param.only?
        # NOTE: intentionally not using (year: ...) to be able to use it
        # in a join wich has only one 'year' field.
        base = base.where("year = ?", @year_param.year)
      end
      if events
        base = base.where(eventId: events)
      end
      if countries.any?
        base = base.where(countryId: countries)
      end
      base
    end

    @results_rows = []

    if !@record_view.any_history?
      csr = scope_with_restrictions.call(ConciseSingleResult.group(:eventId))
      car = scope_with_restrictions.call(ConciseAverageResult.group(:eventId))
      # This is a lambda that turns a "best" result for a given eventId into the
      # corresponding sql restriction.
      # The goal is to let the final query get all results matching for that "best"
      # result. E.g: if for 2x2 the min value is "0.49" for one specific result
      # id, we still need to get all single results whose value is "0.49", not
      # just the one the "minimum()" returned.
      to_where_condition = ->(event_id, valueAndId, field) { "(eventId='#{event_id}' and #{field}='#{valueAndId/ConciseAverageResult::RESULT_ROW_MASK}')" }

      singles = csr.minimum(:valueAndId).map { |e, a| to_where_condition.call(e, a, "best") }
      averages = car.minimum(:valueAndId).map { |e, a| to_where_condition.call(e, a, "average") }
      @results_rows.concat(scope_with_restrictions
        .call(Result.left_joins(:competition).where(singles.join(" or ")))
        .order("year, month, day, roundTypeId, personName")
        .map { |r|
          r.type = "single"
          r
        })
      @results_rows.concat(scope_with_restrictions
        .call(Result.left_joins(:competition).where(averages.join(" or ")))
        .order("year, month, day, roundTypeId, personName")
        .map { |r|
          r.type = "average"
          r
        })
    else
      result_base = Result.left_joins(:competition)
      unscoped_single = result_base.where(regionalSingleRecord: @record_names)
      unscoped_average = result_base.where(regionalAverageRecord: @record_names)
      @results_rows.concat(scope_with_restrictions.call(unscoped_single)
        .map { |r|
          r.type = "single"
          r
        })
      @results_rows.concat(scope_with_restrictions.call(unscoped_average)
        .map { |r|
          r.type = "average"
          r
        })
    end

    # Build the map of competitions based on the the competition ids appearing
    # in the results rows.
    @competitions_by_id = Hash[Competition.where(id: @results_rows.map(&:competitionId).uniq).map { |c| [c.id, c] }]

    # Do a final sort by event so we can just iterate through the rows in the view.
    if @record_view.any_history?
      @results_rows.sort_by! do |r|
        c = @competitions_by_id[r.competitionId]
        fields = [-c.year, -c.month, -c.day]
        if @record_view.history?
          fields.unshift(r.event.rank, r.type[1])
        else
          fields.push(r.event.rank, r.type[1])
        end
      end
    else
      @results_rows.sort_by! { |r| r.event.rank }
    end
  end

  private def restrictions_from_params
    event = nil

    if params[:event_id] != "all events"
      event = Event.c_find!(params[:event_id]).id
    end

    @continent = Continent.c_find(params[:region])
    @country = Country.c_find(params[:region])
    countries = []
    record_names = ["WR"]

    if @continent.present?
      countries.concat(@continent.country_ids)
      record_names << @continent.recordName
    elsif @country.present?
      countries << @country.id
      record_names << "NR"
    end
    [event, countries, record_names]
  end

  private def shared_constants_and_conditions
    @years = Competition.non_future_years
    @types = ["single", "average"]

    if params[:event_id] == "all events"
      @event_condition = ""
    else
      event = Event.c_find!(params[:event_id])
      @event_condition = "AND eventId = '#{event.id}'"
    end

    @continent = Continent.c_find(params[:region])
    @country = Country.c_find(params[:region])
    if @continent.present?
      @region_condition = "AND result.countryId IN (#{@continent.country_ids.map { |id| "'#{id}'" }.join(',')})"
      @region_condition += " AND recordName IN ('WR', '#{@continent.recordName}')" if @is_histories
    elsif @country.present?
      @region_condition = "AND result.countryId = '#{@country.id}'"
      @region_condition += " AND recordName <> ''" if @is_histories
    else
      @region_condition = ""
      @region_condition += "AND recordName = 'WR'" if @is_histories
    end

    @is_all_years = params[:years] == "all years"
    splitted_years_param = params[:years].split
    @is_only = splitted_years_param[0] == "only"
    @is_until = splitted_years_param[0] == "until"
    @year = splitted_years_param[1].to_i
    if @is_only
      @years_condition = "AND year = #{@year}"
    elsif @is_until
      @years_condition = "AND year <= #{@year}"
    else
      @years_condition = ""
    end
  end

  # Normalizes the params so that old links to rankings still work.
  private def support_old_links!
    params[:event_id]&.gsub!("+", " ")

    params[:region]&.gsub!("+", " ")

    params[:years]&.gsub!("+", " ")
    if params[:years] == "all"
      params[:years] = nil
    end

    params[:show]&.gsub!("+", " ")
    params[:show]&.downcase!
    # We are not supporting the all option anymore!
    if params[:show]&.include?("all")
      params[:show] = nil
    end
  end

  private def set_year_param!
    @year_param = ControllerParams::Year.new(params[:years])
    unless @year_param.valid?
      # TODO: flash[:danger] = t(".unknown_type")
      flash[:danger] = "Unknown year param"
      return redirect_to records_path
    end
  end

  private def set_record_view!
    @record_view = ControllerParams::RecordsShow.new(params[:show])
    unless @record_view.valid?
      # TODO: flash[:danger] = t(".unknown_type")
      flash[:danger] = "Unknown show param"
      return redirect_to records_path
    end
  end

  private def set_ranking_view!
    @ranking_view = ControllerParams::RankingsShow.new(params[:show])
    unless @ranking_view.valid?
      flash[:danger] = t("results.ranking.unknown_show")
      return redirect_to records_path
    end
  end

  private def set_type!
    @rank_type = ControllerParams::Type.new(params[:type])
    unless @rank_type.valid?
      flash[:danger] = t("results.ranking.unknown_type")
      return redirect_to rankings_path
    end
  end
end

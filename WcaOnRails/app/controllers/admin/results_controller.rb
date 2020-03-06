# frozen_string_literal: true

module Admin
  class ResultsController < AdminController
    # NOTE: authentication is performed by admin controller

    ASSOCIATIONS = {
      competition: {
        competition_events: {
          # This weird association include is courtesy of time_limit.to_s
          rounds: :competition_event,
        },
        events: [],
      },
    }.freeze

    def new
      @competition = Competition.includes(ASSOCIATIONS[:competition]).find(params[:competition_id])
      @event = Event.c_find!(params[:event_id])
      @round_type = RoundType.c_find!(params[:round_type_id])
      @round = round_from_attributes(@competition, params[:event_id], params[:round_type_id])
      @result = Result.new(competition: @competition, round_type: @round_type,
                           formatId: "a",
                           event: @event)
    end

    def show
      respond_to do |format|
        format.json { render json: Result.find(params.require(:id)) }
      end
    end

    def edit
      # For all view we need the round for the result, if any
      @result = Result.includes(ASSOCIATIONS).find(params[:id])
      @competition = @result.competition
      @round = round_from_attributes(@competition, @result.eventId, @result.roundTypeId)
    end

    def create
    end

    def update
      respond_to do |format|
        result = Result.find(params.require(:id))
        if result.update_attributes(result_params)
          validator = ResultsValidators::PositionsValidator.new(apply_fixes: true)
          # TODO: check perf on WC
          validator.validate(competition_ids: [result.competitionId])
          format.json {
            render json: {
              status: "ok",
              infos: ["The result was saved"].concat(validator.infos.map(&:to_s)),
            }
          }
        else
          format.json {
            render json: {
              errors: result.errors.map { |key, msg| "#{key}: #{msg}" },
            }
          }
        end
      end
    end

    def destroy
      result = Result.find(params.require(:id))
      @competition = result.competition
      result.destroy!
      # Create a results validator to fix positions if needed
      @results_validator = ResultsValidators::CompetitionsResultsValidator.new(
        check_real_results: true,
        validators: [ResultsValidators::PositionsValidator],
        apply_fixes: true,
      )
      @results_validator.validate(@competition.id)
      # and render the check results view
      render "admin/check_results"
    end

    private def round_from_attributes(comp, event_id, round_type_id)
      # This may return nil, for instance for old competitions which don't have
      # round data.
      comp.competition_events
          .find { |ce| ce.event_id == event_id }
          &.rounds
          &.find { |r| r.round_type_id == round_type_id }
    end

    private def result_params
      params.require(:result).permit(:value1, :value2, :value3, :value4, :value5,
                                     :best, :average,
                                     # TODO: I think these are overridable per-result
                                     # because of our concept of multiple person
                                     # attached to a single WCA ID (eg: different
                                     # country or name over time)
                                     :personId, :personName, :countryId,
                                     :regionalSingleRecord, :regionalAverageRecord)
    end
  end
end

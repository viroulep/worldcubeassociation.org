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

    # FIXME: actually implement this
    def new
      @competition = Competition.includes(ASSOCIATIONS[:competition]).find(params[:competition_id])
      @round = Round.find(params[:round_id])
      # Create some basic attributes for that empty result.
      # Using Result.new wouldn't work here: we have no idea what the country
      # could be and so on, so serialization would fail.
      @result = {
        competition_id: @competition.id,
        round_type_id: @round.round_type_id,
        format_id: @round.format.id,
        event_id: @round.event.id,
      }
    end

    def show
      respond_to do |format|
        format.json { render json: Result.find(params.require(:id)) }
      end
    end

    def edit
      @result = Result.includes(:competition).find(params[:id])
      @competition = @result.competition
    end

    def create
      round_attrs = round_params
      # Start by finding the round matching the params!
      round = Round.find_for(round_attrs[:competitionId],
                             round_attrs[:eventId],
                             round_attrs[:roundTypeId])
      unless round
        return render status: :bad_request, json: { error: "can't find round" }
      end

      # We have a round, build a brand new result.
      result = Result.new(round_attrs)
      result.assign_attributes(result_params)
      # Make sure the format is filled from the correct round's info.
      result.formatId = round.format.id
      json = {}
      if result.save
        # We just inserted a new result, make sure we at least give it the
        # correct position.
        validator = ResultsValidators::PositionsValidator.new(apply_fixes: true)
        validator.validate(competition_ids: [result.competitionId])
        json[:messages] = ["Result inserted!"].concat(validator.infos.map(&:to_s))
      else
        json[:errors] = result.errors.map { |key, msg| "#{key}: #{msg}" }
      end
      render json: json
    end

    def update
      result = Result.find(params.require(:id))
      if result.update_attributes(result_params)
        validator = ResultsValidators::PositionsValidator.new(apply_fixes: true)
        validator.validate(competition_ids: [result.competitionId])
        info = if result.saved_changes.empty?
                 "It looks like you submitted the exact same result, so no changes were made."
               else
                 "The result was saved."
               end
        render json: {
          messages: [info].concat(validator.infos.map(&:to_s)),
        }
      else
        render json: {
          errors: result.errors.map { |key, msg| "#{key}: #{msg}" },
        }
      end
    end

    def destroy
      # TODO: fix/implement this
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

    private def result_params
      params.require(:result).permit(:value1, :value2, :value3, :value4, :value5,
                                     :personName, :personId, :countryId,
                                     :best, :average,
                                     :regionalSingleRecord, :regionalAverageRecord)
    end

    private def round_params
      params.require(:round).permit(:competitionId, :roundTypeId, :eventId)
    end
  end
end

# frozen_string_literal: true

class RoundsController < ApplicationController
  private def round_from_params
    Round.includes(:competition).find(params.require(:id)).tap do |r|
      unless r.competition.user_can_view?(current_user)
        raise ActionController::RoutingError.new('Not Found')
      end
    end
  end

  def show
    round = round_from_params
    respond_to do |format|
      format.json { render json: round.to_string_map }
    end
  end
end

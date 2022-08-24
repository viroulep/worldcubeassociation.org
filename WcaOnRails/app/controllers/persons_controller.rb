# frozen_string_literal: true

class PersonsController < ApplicationController
  def competitions
    @person = Person.current.includes(:user).find_by_wca_id!(params[:person_id])
    # TODO: includes properly
    @user = @person.user
    source = @person.competitions
    case params[:source]
    when "organizer"
      source = @user&.organized_competitions
    when "delegate"
      source = @user&.delegated_competitions
    when "trainee"
      source = @user&.trainee_delegated_competitions
    end

    # We absolutely want to put the "visible" scope here: we don't want to leak
    # upcoming WIP competitions.
    if source
      @competitions = source.includes(
        :organizers,
        :delegates,
        :trainee_delegates,
        :competition_organizers,
        :competition_delegates,
        :competition_trainee_delegates,
      ).visible.order(start_date: :desc).page(params[:page]).per(20)
    else
      @competitions = []
    end
    nested_user_attributes = {
      only: ["id", "name"],
      methods: ["url"],
      include: nil,
    }
    serialized_attributes = {
      only: ["id", "name", "start_date", "end_date"],
      methods: ["url", "country_iso2", "city"],
      include: {
        delegates: nested_user_attributes,
        organizers: nested_user_attributes,
        trainee_delegates: nested_user_attributes,
      },
    }
    render json: {
      name: @person.name,
      user_id: @user&.id,
      totalCompetitor: @person.competitions.visible.size,
      totalOrganizer: @user ? @user.organized_competitions.visible.size : 0,
      totalDelegate: @user ? @user.delegated_competitions.visible.size : 0,
      totalTrainee: @user ? @user.trainee_delegated_competitions.visible.size : 0,
      competitions: @competitions.as_json(serialized_attributes),
      totalPages: @competitions.any? ? @competitions.total_pages : 0,
    }
  end

  def index
    respond_to do |format|
      format.html
      format.js do
        persons = Person.in_region(params[:region]).order(:name)
        params[:search]&.split&.each do |part|
          persons = persons.where("MATCH(rails_persons.name) AGAINST (:name_match IN BOOLEAN MODE) OR wca_id LIKE :wca_id_part", name_match: "#{part}*", wca_id_part: "#{part}%")
        end

        render json: {
          total: persons.count,
          rows: persons.limit(params[:limit]).offset(params[:offset]).map do |person|
            {
              name: view_context.link_to(person.name, person_path(person.wca_id)),
              wca_id: person.wca_id,
              country: person.country.name,
              competitions_count: person.competitions.count,
              podiums_count: person.results.podium.count,
            }
          end,
        }
      end
    end
  end

  def show
    @person = Person.current.includes(:user, :ranksSingle, :ranksAverage, :competitions).find_by_wca_id!(params[:id])
    @previous_persons = Person.where(wca_id: params[:id]).where.not(subId: 1).order(:subId)
    @ranks_single = @person.ranksSingle.select { |r| r.event.official? }
    @ranks_average = @person.ranksAverage.select { |r| r.event.official? }
    @medals = @person.medals
    @records = @person.records
    @results = @person.results.includes(:competition, :event, :format, :round_type).order("Events.rank, Competitions.start_date DESC, Competitions.id, RoundTypes.rank DESC")
    @championship_podiums = @person.championship_podiums
    params[:event] ||= @results.first.event.id
  end
end

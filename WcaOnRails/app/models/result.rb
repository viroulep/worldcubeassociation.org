# frozen_string_literal: true

class Result < ApplicationRecord
  include Resultable

  self.table_name = "Results"

  belongs_to :person, -> { current }, primary_key: :wca_id, foreign_key: :personId
  belongs_to :country, foreign_key: :countryId
  validates :country, presence: true

  # NOTE: both nil and "" exist in the database, we may consider cleaning that up.
  MARKERS = [nil, "", "NR", "ER", "WR", "AfR", "AsR", "NAR", "OcR", "SAR"].freeze

  validates_inclusion_of :regionalSingleRecord, in: MARKERS
  validates_inclusion_of :regionalAverageRecord, in: MARKERS

  def country
    Country.c_find(self.countryId)
  end

  scope :final, -> { where(roundTypeId: RoundType.final_rounds.map(&:id)) }
  scope :succeeded, -> { where("best > 0") }
  scope :podium, -> { final.succeeded.where(pos: [1..3]) }
  scope :winners, -> { final.succeeded.where(pos: 1).joins(:event).order("Events.rank") }

  def serializable_hash(options = nil)
    res_hash = {
      id: id,
      competition_id: competitionId,
      pos: pos,
      event_id: eventId,
      round_type_id: roundTypeId,
      format_id: formatId,
      attempts: [value1, value2, value3, value4, value5],
      best: best,
      average: average,
      regional_single_record: regionalSingleRecord || "",
      regional_average_record: regionalAverageRecord || "",
      wca_id: "",
      person_name: "",
      country_iso2: "",
    }
    # There is an edge case where we're building an empty result, which doesn't have
    # a person!
    if person
      res_hash.merge!(
        wca_id: personId,
        person_name: personName,
        country_iso2: country.iso2,
      )
    end
  end
end

# frozen_string_literal: true

class Post < ApplicationRecord
  include MarkdownHelper
  belongs_to :author, class_name: "User"
  has_many :post_tags, autosave: true, dependent: :destroy
  include Taggable

  scope :visible, -> { where(world_readable: true) }

  validates :title, presence: true, uniqueness: true
  validates :body, presence: true
  validates :slug, presence: true, uniqueness: true

  validate :unstick_at_must_be_in_the_future, if: :unstick_at
  private def unstick_at_must_be_in_the_future
    if unstick_at <= Date.today
      errors.add(:unstick_at, I18n.t('posts.errors.unstick_at_future'))
    end
  end

  before_validation :clear_unstick_at, unless: :sticky?
  private def clear_unstick_at
    self.unstick_at = nil
  end

  BREAK_TAG_RE = /<!--\s*break\s*-->/.freeze

  def body_full
    body.sub(BREAK_TAG_RE, "")
  end

  def body_teaser
    split = body.split(BREAK_TAG_RE)
    split.first
  end

  before_validation :compute_slug
  private def compute_slug
    self.slug = title.parameterize
  end

  CRASH_COURSE_POST_SLUG = "delegate-crash-course"

  def self.delegate_crash_course_post
    Post.find_or_create_by!(slug: CRASH_COURSE_POST_SLUG) do |post|
      post.title = "Delegate crash course"
      post.body = "Nothing here yet"
      post.show_on_homepage = false
      post.world_readable = false
    end
  end

  def deletable
    persisted? && !is_delegate_crash_course_post?
  end

  def edit_path
    if is_delegate_crash_course_post?
      Rails.application.routes.url_helpers.panel_delegate_crash_course_edit_path
    else
      Rails.application.routes.url_helpers.edit_post_path(slug)
    end
  end

  def update_path
    if is_delegate_crash_course_post?
      Rails.application.routes.url_helpers.panel_delegate_crash_course_path
    else
      Rails.application.routes.url_helpers.post_path(self)
    end
  end

  def self.search(query, params: {})
    posts = Post.where(world_readable: true)
    query&.split&.each do |part|
      posts = posts.where("title LIKE :part OR body LIKE :part", part: "%#{part}%")
    end
    posts.order(created_at: :desc)
  end

  def serializable_hash(options = nil)
    json = {
      class: self.class.to_s.downcase,
      id: id,
      slug: slug,
      url: Rails.application.routes.url_helpers.post_path(slug),
      title: title,
      author: author,
      createdAt: created_at.in_time_zone.utc.iso8601,
    }
    if options[:api]
      json[:body] = body
    else
      json[:sticky] = sticky?
      json[:teaser] = md(body_teaser)
      if options[:can_manage]
        json[:edit_url] = edit_path
      end
    end

    json
  end

  private def is_delegate_crash_course_post?
    slug == CRASH_COURSE_POST_SLUG
  end
end

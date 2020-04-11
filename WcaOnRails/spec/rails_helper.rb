# frozen_string_literal: true

# This file is copied to spec/ when you run 'rails generate rspec:install'
ENV['RAILS_ENV'] ||= 'test'
require 'spec_helper'
require File.expand_path('../config/environment', __dir__)
require 'rspec/rails'
# Add additional requires below this line. Rails is not loaded until this point!

# From http://everydayrails.com/2012/04/24/testing-series-rspec-requests.html
require "capybara/rspec"
require 'capybara-screenshot/rspec'
require 'capybara/poltergeist'

# Requires supporting ruby files with custom matchers and macros, etc, in
# spec/support/ and its subdirectories. Files matching `spec/**/*_spec.rb` are
# run as spec files by default. This means that files in spec/support that end
# in _spec.rb will both be required and run as specs, causing the specs to be
# run twice. It is recommended that you do not name files matching this glob to
# end with _spec.rb. You can configure this pattern with the --pattern
# option on the command line or in ~/.rspec, .rspec or `.rspec-local`.
#
# The following line is provided for convenience purposes. It has the downside
# of increasing the boot-up time by auto-requiring all files in the support
# directory. Alternatively, in the individual `*_spec.rb` files, manually
# require only the support files necessary.
#
Dir[Rails.root.join('spec/support/**/*.rb')].each { |f| require f }

# Checks for pending migrations before tests are run.
# If you are not using ActiveRecord, you can remove this line.
ActiveRecord::Migration.maintain_test_schema!

# To debug feature specs using phantomjs, set `Capybara.javascript_driver = :poltergeist_debug`
# and then call `page.driver.debug` in your feature spec.
# Phantomjs' options are required to test Stripe.js (to load their script from a non https server)
Capybara.register_driver :poltergeist_debug do |app|
  Capybara::Poltergeist::Driver.new(app, inspector: true, phantomjs: Phantomjs.path, debug: true, phantomjs_options: ['--ignore-ssl-errors=yes', '--ssl-protocol=any'])
end

# Phantomjs' options are required to test Stripe.js (to load their script from a non https server)
Capybara.register_driver :poltergeist do |app|
  Capybara::Poltergeist::Driver.new(app, js_errors: true, phantomjs: Phantomjs.path, phantomjs_options: ["--ignore-ssl-errors=yes", "--ssl-protocol=any"])
end

Capybara.javascript_driver = :poltergeist
Capybara.server = :webrick

RSpec.configure do |config|
  # We're using database_cleaner instead of rspec-rails's implicit wrapping of
  # tests in database transactions.
  # See http://devblog.avdi.org/2012/08/31/configuring-database_cleaner-with-rails-rspec-capybara-and-selenium/
  # See https://github.com/DatabaseCleaner/database_cleaner
  config.use_transactional_fixtures = false

  # RSpec Rails can automatically mix in different behaviours to your tests
  # based on their file location, for example enabling you to call `get` and
  # `post` in specs under `spec/controllers`.
  #
  # You can disable this behaviour by removing the line below, and instead
  # explicitly tag your specs with their type, e.g.:
  #
  #     RSpec.describe UsersController, type: :controller do
  #       # ...
  #     end
  #
  # The different available types are documented in the features, such as in
  # https://relishapp.com/rspec/rspec-rails/docs
  config.infer_spec_type_from_file_location!

  # Make helpers available in feature specs
  config.include SessionHelper, type: :feature
  config.include SelectizeHelper, type: :feature

  # Make sign_in helper available in controller and request specs
  config.include ApiSignInHelper, type: :controller
  config.include ApiSignInHelper, type: :request

  config.include ApplicationHelper

  config.include ActiveJob::TestHelper
end

# See: https://github.com/rspec/rspec-expectations/issues/664#issuecomment-58134735
RSpec::Matchers.define_negated_matcher :not_change, :change

# Assumes value to be a string
# We use a unmaintained and most probably deprecated capybara driver (poltergeist)
# We run into this for some of our tests: https://github.com/teamcapybara/capybara/issues/2105
# Therefore this is a fix by going the "send_keys" way instead of the "fill_in"
def wca_fill_in(selector, value, **options)
  elem = if selector
           find_field(selector, **options)
         else
           find_field(**options)
         end
  unless elem.value.blank?
    elem.value.length.times do
      elem.native.send_keys(:backspace)
    end
  end
  elem.native.send_keys(*value.split(''))
end

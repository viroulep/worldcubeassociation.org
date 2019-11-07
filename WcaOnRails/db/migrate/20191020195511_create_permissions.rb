# frozen_string_literal: true

class CreatePermissions < ActiveRecord::Migration[5.2]
  def change
    create_table :permissions do |t|
      t.integer :entity_id
      t.string :entity_type
      t.boolean :manage_permission, default: false
      t.boolean :view_permission, default: false
      t.boolean :manage_users, default: false
      t.boolean :view_users, default: false
      t.boolean :view_leader_material, default: false
      t.boolean :view_senior_delegate_material, default: false
      t.boolean :manage_result, default: false
      t.boolean :manage_finances, default: false
    end
    add_index :permissions, [:entity_type, :entity_id]

    change_table :users do |t|
      t.references :permissions, polymorphic: true
    end

    change_table :teams do |t|
      t.references :permissions, polymorphic: true
    end
  end
end

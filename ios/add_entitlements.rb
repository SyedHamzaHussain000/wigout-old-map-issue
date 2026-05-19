require 'xcodeproj'

project_path = 'Wigout.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |t| t.name == 'Wigout' }

# Find or create a group for WigOut
group = project.main_group.find_subpath(File.join('WigOut'), true)
group.set_source_tree('SOURCE_ROOT')

# Create file reference for entitlements
file_path = 'WigOut/Wigout.entitlements'
file_reference = group.files.find { |f| f.path == 'Wigout.entitlements' || f.path == 'WigOut/Wigout.entitlements' }
unless file_reference
  file_reference = group.new_reference(file_path)
end

# Set CODE_SIGN_ENTITLEMENTS build setting
target.build_configurations.each do |config|
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = file_path
end

# Add push notifications capability
project.root_object.attributes['TargetAttributes'] ||= {}
project.root_object.attributes['TargetAttributes'][target.uuid] ||= {}
project.root_object.attributes['TargetAttributes'][target.uuid]['SystemCapabilities'] ||= {}
project.root_object.attributes['TargetAttributes'][target.uuid]['SystemCapabilities']['com.apple.Push'] = {
  'enabled' => '1'
}
project.root_object.attributes['TargetAttributes'][target.uuid]['SystemCapabilities']['com.apple.BackgroundModes'] = {
  'enabled' => '1'
}

project.save
puts 'Successfully added Entitlements to Wigout target'

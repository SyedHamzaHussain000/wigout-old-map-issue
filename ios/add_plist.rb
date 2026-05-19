require 'xcodeproj'

project_path = 'Wigout.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |t| t.name == 'Wigout' }

# Find or create a group for Wigout
group = project.main_group.find_subpath(File.join('Wigout'), true)
group.set_source_tree('SOURCE_ROOT')

# Create file reference
file_path = 'Wigout/GoogleService-Info.plist'
# Check if it already exists to avoid duplicates
unless group.files.find { |f| f.path == 'GoogleService-Info.plist' || f.path == 'Wigout/GoogleService-Info.plist' }
  file_reference = group.new_reference(file_path)
  
  # Add to build phase
  resources_build_phase = target.resources_build_phase
  unless resources_build_phase.files_references.include?(file_reference)
    resources_build_phase.add_file_reference(file_reference, true)
  end
  
  project.save
  puts 'Successfully added GoogleService-Info.plist to Wigout target'
else
  puts 'GoogleService-Info.plist already referenced in Xcode project'
end

require 'xcodeproj'

project_path = 'Wigout.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |t| t.name == 'Wigout' }

# Find Copy Bundle Resources phase
resources_phase = target.resources_build_phase

# Remove .ttf files from the phase
resources_phase.files.each do |build_file|
  if build_file.file_ref && build_file.file_ref.path && build_file.file_ref.path.end_with?('.ttf')
    puts "Removing #{build_file.file_ref.path} from Copy Bundle Resources"
    resources_phase.remove_build_file(build_file)
  end
end

# Find the Resources group created by react-native-asset and remove .ttf files from it
resources_group = project.main_group.find_subpath('Resources', false)
if resources_group
  resources_group.files.each do |file_ref|
    if file_ref.path && file_ref.path.end_with?('.ttf')
      file_ref.remove_from_project
    end
  end
end

project.save
puts 'Cleaned up duplicate fonts from project.pbxproj'

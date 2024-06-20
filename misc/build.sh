#!/usr/bin/env bash

# Builds Gigwa from scratch, by, for each project:
# - git-cloning the master branch
# - checking out the tag which named after the value found in pom.xml's <project.version>
# - clearing each Maven artifact's folder in the local Maven repo (to be sure versions are in sync)
# - launching mvn install (forwarding script arguments) on Gigwa/bom/pom.xml which refers to all sub-projects as modules
#
# WARNING - Don't launch this script from its original location (within the Gigwa2 source hierarchy) as it would create duplicate source files in your IDE workspace

set -e

# Function to print the current directory for debugging
print_current_dir() {
  echo "Current directory: $(pwd)"
}

# Clone the Gigwa2 repository
echo "Cloning Gigwa2 repository"
git clone https://github.com/SouthGreenPlatform/Gigwa2.git

cd ./Gigwa2
print_current_dir

# Get the latest tag
echo "Fetching tags"
git fetch --tags

latest_tag=$(git describe --tags --abbrev=0 $(git rev-list --tags --max-count=1))
echo "Latest tag: $latest_tag"

# Check if the latest tag is STAGING
if [ "$latest_tag" == "STAGING" ]; then
  previous_tag=$(git describe --tags --abbrev=0 $(git rev-list --tags --skip=1 --max-count=1))
  echo "Latest tag is STAGING, using previous tag: $previous_tag"
  git checkout $previous_tag
else
  echo "Using latest tag: $latest_tag"
  git checkout $latest_tag
fi

# Get the list of dependencies
echo "Running Maven dependency tree"
dependencies=$(mvn dependency:tree | grep -v WARNING | grep "fr\.cirad.*\-RELEASE" | awk '
{
  if (match($0, /fr\.cirad:[^:]+:(jar|war):[^:]+/)) {
    split(substr($0, RSTART, RLENGTH), arr, ":");
    app_name = arr[2];
    release_name = arr[4];
    print app_name ":" release_name;
  }
}')

echo "Dependencies found: $dependencies"

# Convert the list of dependencies into an array
subProjects=()
while IFS= read -r line; do
  subProjects+=("$line")
done <<< "$dependencies"

cd ..
print_current_dir

# Clone the sub-projects
echo "Cloning sub-projects"
for subProject in "${subProjects[@]}"; do
  app_name=$(echo "$subProject" | awk -F':' '{print $1}')
  release_name=$(echo "$subProject" | awk -F':' '{print $2}')

  echo "Cloning $app_name with tag $release_name"

  if [ "$app_name" == "Gigwa2" ]; then
    continue
  fi

  git clone -b $release_name --single-branch "https://github.com/GuilhemSempere/$app_name.git"
done

cd ./Gigwa2/bom/
print_current_dir

echo "Running Maven install"
mvn install "$@"
echo "Maven install completed"
cd ../..
print_current_dir

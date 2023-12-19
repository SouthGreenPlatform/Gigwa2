#!/usr/bin/env bash

# Builds Gigwa from scratch, by, for each project:
# - git-cloning the master branch
# - checking out the tag which named after the value found in pom.xml's <project.version>
# - clearing each Maven artifact's folder in the local Maven repo (to be sure versions are in sync)
# - launching mvn install (forwarding script arguments) on Gigwa/bom/pom.xml which refers to all sub-projects as modules
#
# WARNING - Don't launch this script from its original location (within the Gigwa2 source hierarchy) as it would create duplicate source files in your IDE workspace

set -e

m2repo=$(mvn help:evaluate -Dexpression=settings.localRepository -q -DforceStdout)

declare -a subProjects=(GuilhemSempere/GenotypeFileManipulation GuilhemSempere/Mgdb2BrapiModel GuilhemSempere/Mgdb2 GuilhemSempere/Mgdb2Export GuilhemSempere/role_manager GuilhemSempere/Mgdb2BrapiImpl GuilhemSempere/Mgdb2BrapiV2Impl GuilhemSempere/Gigwa2ServiceInterface GuilhemSempere/Gigwa2ServiceImpl SouthGreenPlatform/Gigwa2)

for subProject in ${subProjects[*]} ;
do
  echo
  subProjectName="${subProject##*/}"
  rm -rf $subProjectName
  git clone -b master --single-branch https://github.com/$subProject.git

  cd $subProjectName
  tag=$(grep -m 1 project\\\.version pom.xml | sed -n 's/.*<project\.version>\(.*\)<\/project\.version>.*/\1/p')
  echo Switching to tag $tag in project $subProjectName
  git -c advice.detachedHead=false checkout $tag
  artifactId=$(grep -m 1 artifactId pom.xml | sed -n 's/.*<artifactId>\(.*\)<\/artifactId>.*/\1/p')

  echo Cleaning $subProjectName folder in local m2 repository
  rm -rf $m2repo/fr/cirad/$artifactId
  cd ..
done
  
cd Gigwa2/bom/
mvn install $@
cd ../..
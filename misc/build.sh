#!/usr/bin/env bash

# Builds Gigwa from scratch, cloning all involved projects from the master branch and clearing each manifest's folder in the local repo (to be sure versions are in sync)

set -e

m2repo=$(mvn help:evaluate -Dexpression=settings.localRepository -q -DforceStdout)

declare -a subProjects=(GuilhemSempere/GenotypeFileManipulation GuilhemSempere/Mgdb2BrapiModel GuilhemSempere/Mgdb2 GuilhemSempere/Mgdb2Export GuilhemSempere/role_manager GuilhemSempere/Gigwa2ServiceInterface GuilhemSempere/Gigwa2ServiceImpl GuilhemSempere/Mgdb2BrapiImpl GuilhemSempere/Mgdb2BrapiV2Impl SouthGreenPlatform/Gigwa2)

for subProject in ${subProjects[*]} ;
  do
  	subProjectName="${subProject##*/}"
    rm -rf $subProjectName
    git clone https://github.com/$subProject.git

    echo
    echo Cleaning $subProjectName folder in local m2 repository
    cd $subProjectName
	artifactId=$(grep -m 1 artifactId pom.xml | sed -n 's/.*<artifactId>\(.*\)<\/artifactId>.*/\1/p')
    rm -rf $m2repo/fr/cirad/$artifactId

    echo
	if [ "$subProjectName" = "Gigwa2" ]
	then
	  extraArgs="$@"
	  echo "Building $subProjectName with Maven arguments: $extraArgs"
	else
	  extraArgs=""
	  echo Building $subProjectName
	fi

    mvn install $extraArgs
    echo
    cd ..
  done
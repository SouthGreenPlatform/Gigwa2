# Gigwa2

Gigwa aims at managing genomic and genotyping data from NGS analyses. It is a tool targeted at users with little computer expertise, providing means to explore visually large amounts of genotyping data by filtering it based not only on variant features including functional annotations, but also on genotypes themselves. It also supports numerous standard import / export formats, statistical graph realtime calculation and dynamic display, and online visualization via IGV.js and Flapjack-Bytes.

Try Gigwa online with public datasets at https://gigwa.southgreen.fr/

## Latest webapp and bundles are now available for download on Gigwa homepage: http://southgreen.fr/content/gigwa

## Check the wiki:
https://github.com/SouthGreenPlatform/Gigwa2/wiki

## Developer instructions

The source code is available in this repository. It uses Maven for dependency management and requires the following dependencies to be present in your workspace (order matters):

##### https://github.com/GuilhemSempere/GenotypeFileManipulation
##### https://github.com/GuilhemSempere/Mgdb2BrapiModel
##### https://github.com/GuilhemSempere/Mgdb2
##### https://github.com/GuilhemSempere/Mgdb2Export
##### https://github.com/GuilhemSempere/role_manager
##### https://github.com/GuilhemSempere/Mgdb2BrapiImpl
##### https://github.com/GuilhemSempere/Mgdb2BrapiV2Impl
##### https://github.com/GuilhemSempere/Gigwa2ServiceInterface
##### https://github.com/GuilhemSempere/Gigwa2ServiceImpl

Gigwa2 project now contains **bom/pom.xml** which can be used as a parent project that **treats all required projects as Maven modules**, and thus **allows to build them all with a single mvn install** (all projects, including Gigwa2 have to sit at the same level though)

A quick and convenient way to **build the latest version of Gigwa at once** is to use the following script misc/build.sh:
- ideally not from within the Gigwa2 source hierarchy, otherwise it will create duplicate source files
- assuming that for each referenced project, a git tag exists, named after the value found in pom.xml's <project.version>

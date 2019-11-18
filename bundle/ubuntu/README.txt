INSTRUCTIONS ON HOW TO RUN THE BUNDLED VERSION OF GIGWA
-------------------------------------------------------

The folder this file is contained in is the root of your Gigwa installation. It contains all the 3rd party software required for Gigwa to run. Everything related to Gigwa is and will remain in this folder. Uninstalling Gigwa and its data is therefore as simple as deleting this folder. However since the created database files and temporary export files will be created there, you must make sure that the free space on the disk containing this folder is at least twice the size of the files you are planning to import.

The root folder also contains two script files, startGigwa and stopGigwa (with different extensions according to the OS).

Launching startGigwa:

- checks that Gigwa default ports (59393 to 59396) are free (in other words, that no other instances are running)

- starts Tomcat and MongoDB

- opens the following URL in your default web-browser: http://localhost:59395/gigwa (leading to your local Gigwa instance)

Launching stopGigwa just cleanly stops Tomcat and MongoDB. Be aware that the web-page will remain open in your web-browser but will not be functional anymore, unless you launch startGigwa again.

When you restart Gigwa, you will find any previously entered data again (a sample data file is provided in this archive, in the vcf folder). A new browser window or tab will open, no matter if you closed the previous one or not. They will both be functional anyway.


NB: The prerequisites (Java Runtime Environment, Apache Tomcat and MongoDB) are unmodified, free software, and are distributed along with their license information files.

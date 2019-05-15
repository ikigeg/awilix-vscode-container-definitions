# Awilix VSCode Container Definitions

This extension is for a very specific use case where a single file is used to declare all variables registered to a container. Presently this is handled by reading the actual container file, parsing it, then mapping line and column for the discovered variables/registrations. If you attempt to click through to a definition that is found in the container file, VSCode will present you with the discovered definitions.

## Features

Will add definitions to any symbol that has matching variables declared against a container, these will be both to the container registration, and the initial variable declaration (if detected).

## Requirements

* [Awilix](https://www.npmjs.com/package/awilix) node module to be installed
* All container registrations to be present in a single file. If the name is not `container.js` then it can be defined in the configuration

## Extension Settings

This extension contributes the following settings:

* `awilix.containerFile`: Name of the file where your Awilix container has been created with registered variables

## Known Issues

* Reads the container file rather than importing, so cannot handle any fancy variable-based registration of variables
* Parses the container file each time you click for a definition
* No tests 😿

## Release Notes

Users appreciate release notes as you update your extension.

### 0.0.1

First stab at this, reads the container registrations from a given file

v1.2.0 / 2018-02-27
==================

  * Configurable event interval

v1.1.0 / 2018-02-26
==================

  * Add RELEASE.md
  * Generate CHANGELOG for past versions
  * Add badges to README
  * Adds fastboot support Exit event registration early if in fastboot
  * Updates .travis.yml to use sudo which ensures correct permissions for chrome headless sandbox fixes #8836
  * Passes the original event through to the registered callbacks
  * Adds unit tests to ensure the event is passed through un-manipulated
  * Updates the unified-event-handler service to propogate the original event through to the registered callback
  * Adds some notes to the README closes #19

v1.0.4 / 2017-11-20
===================

  * Moved away from using anonymous functions for throttlers

v1.0.3 / 2017-11-16
===================

  * Updating Ember-CLI blueprint and fixing leaking run.throttle

v1.0.2 / 2017-03-07
===================

  * Use native accessor for handler map interactions
  * Test register method targeting element.class
  * Cleanup registered handlers on destroy
  * Upgrade all dependencies
  * Fix minor typos

v1.0.1 / 2016-09-20
===================

  * Re-export UEH service
  * Simplify handler cache
  * Add documentation to README

v1.0.0 / 2015-08-07
===================

  * Update package.json and readme for initial release
  * Add original version of unified-event-handler
  * Initial Commit from Ember CLI v1.13.7

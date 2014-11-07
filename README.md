redmine_hacks
=============

### Various javascript hacks to improve the redmine UI

* Allow to sum group by using an arbitrary value instead of item count
* Added grag and drop between group by

## Installation

### Chrome
* Install http://tampermonkey.net/
* Click "Add a new script..." in the plugin menu and paste:


    // ==UserScript==
    // @name         Redmine Drag 'n drop
    // @include      https://redmine.priv.8d.com/*/issues*
    // @grant        none
    // @updateURL https://raw.githubusercontent.com/MacKeeper/redmine_hacks/master/hacks.js
    // @downloadURL https://raw.githubusercontent.com/MacKeeper/redmine_hacks/master/hacks.js
    // ==/UserScript==

## Known issues
* Drag and drop between group only works for assignee and custom fields

## Roadmap
* Hot key to edit an issue when in detail page
* Hot key to popup quick find to switch project
* Auto-sum all numeric fields
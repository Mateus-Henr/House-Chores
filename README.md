# House-Chores

> Code for Google Script used for notifying about events related to a house where three people live together.

## How does it work?
By interacting with a Google Spreadsheet sheet, the sheet is checked in order to see if there are any chores to the current day. If there is, an event is created on the person's Google Calendar associated with that event. This way, a notification pops up to notify the person about the chores specified to him/her. In the current version of the code, triggers are set throughout the day (Google Script offers this resource) that will be checking whether or not a chore has been marked as done in the spreadsheet. These triggers can create up to three events throughout the day if the event hasn't been marked as done on the sheet. In addition to that, the code also updates the specified sheet in order to change the day of the chores, for example for daily chores, at the end of the day, their dates are updated to the next day to keep the sheet updated. For weekly chores, the person who's in charge of that chore will be changed weekly.

## Exceptions
Weekends are one exception when events are not created.

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1nx17ZaxrphRWD02PE3j58JpM7zs_wy7MlME3eTw6uHw/edit#gid=1386834576";
const MATT_ID = "h.teteu@gmail.com";
const VITOR_ID = "vitorriblacerda@gmail.com";
const JOAO_ID = "belfort.joao216@gmail.com";
const MATT = "Mateus";
const VITOR = "Vitor";
const JOAO = "João";

const WEEKLY_TASK = "Wash the toilet";

// Values of the days when using "Date.getDay()"
const SUNDAY = 0;
const SATURDAY = 6;

// Indexes of sheet's data.
const CHECKBOX_INDEX = 0;
const DATE_INDEX = 1;
const TASK_INDEX = 2;
const PERSON_INDEX = 3;

// Times for when to create the events.
var MORNING_TIME = createTime(06, 40, 00);
var EVENING_TIME = createTime(12, 40, 00);
var NIGHT_TIME = createTime(18, 40, 00);

var START_DAY_TIME = createTime(00, 00, 00);
var END_DAY_TIME = createTime(23, 59, 59);

var NEXT_DAY_TIME = createTime(24, 00, 00);

// Opening SpreadSheet
var spreadsheet = SpreadsheetApp.openByUrl(SHEET_URL);

// Defining variables for accessing house members calendars.
var eventCalendarMatt = CalendarApp.getCalendarById(MATT_ID);
var eventCalendarVitor = CalendarApp.getCalendarById(VITOR_ID);
var eventCalendarJoao = CalendarApp.getCalendarById(JOAO_ID);


/*
 * Checks if there were any tasks that aren't marked as done. If there's it'll call the method to update it on the calendar.
 * Could be considered as our "main" method.
 */
function checkIfAllTasksAreCompleted()
{
  var tasksData = spreadsheet.getRange("A4:D" + getPositionOfLastTask()).getValues();
  
  for (var i = 0; i < tasksData.length; i++)
  {
    var isCompleted = tasksData[i][CHECKBOX_INDEX];
    var taskTime = new Date(tasksData[i][DATE_INDEX]);

    if (!isCompleted && isTaskDueToToday(taskTime))
    {
      getInformationFromSheet();
      return;
    }
  }

  Logger.log("All events completed.");
}


/*
 * Retrieves information from the sheet in order to create an event in the calendar for the person associated to that task.
 */
function getInformationFromSheet()
{
  var tasksData = spreadsheet.getRange("A4:D" + getPositionOfLastTask()).getValues();
  
  for (var i = 0; i < tasksData.length; i++)
  {
    var isCompleted = tasksData[i][CHECKBOX_INDEX];
    var taskDate = tasksData[i][DATE_INDEX];
    var taskTitle = tasksData[i][TASK_INDEX];
    var taskPerson = tasksData[i][PERSON_INDEX];

    if (taskTitle && !isCompleted && isTaskDueToToday(taskDate) && !isCurrentDayAWeekend())
    {
      switch (taskPerson)
      {
          case MATT:
            writeEvent(eventCalendarMatt, taskTitle);
            break;
          case VITOR:
            writeEvent(eventCalendarVitor, taskTitle);
            break;
          case JOAO:
            writeEvent(eventCalendarJoao, taskTitle);
            break;
          default:
            Logger.log("Person Not Found!");
            break;
      }
    }
  }
}


/*
 * Writes the event on the calendar.
 *
 * @param   event       a variable with the Calendar ID associated with a specific person.
 * @param   taskTitle   a title for the task.
 */
function writeEvent(event, taskTitle)
{
  if (!event)
  {
    Logger.log("Event invalid.");
    return;
  }

  var hoursNow = new Date().getHours();

  try
  {
    if (hoursNow < MORNING_TIME.getHours())
    {
      if (!eventExists(event, taskTitle, MORNING_TIME))
      {
        event.createEvent(taskTitle, MORNING_TIME, MORNING_TIME);
        Logger.log("Morning event created at " + MORNING_TIME);
      }
    }
    else if (hoursNow < EVENING_TIME.getHours())
    {
      if (!eventExists(event, taskTitle, EVENING_TIME))
      {
        deletePreviousEvent(event, taskTitle);

        event.createEvent(taskTitle, EVENING_TIME, EVENING_TIME);
        Logger.log("Evening event created at " + EVENING_TIME);
      }
    }
    else if (hoursNow < NIGHT_TIME.getHours())
    {
      if (!eventExists(event, taskTitle, NIGHT_TIME))
      {
        deletePreviousEvent(event, taskTitle);

        event.createEvent(taskTitle, NIGHT_TIME, NIGHT_TIME);
        Logger.log("Night event created at " + NIGHT_TIME);
      }
    }
    else
    {
      deletePreviousEvent(event, taskTitle);
    }
  }
  catch (e)
  {
    Logger.log("Error trying to create event!");
  }
}


/*
 * Deletes any previous events on the current day with the title equal to the given parameter.
 * 
 * @param   event       a variable with the Calendar ID associated with a specific person.
 * @param   taskTitle   a title for the task.
 */
function deletePreviousEvent(event, taskTitle)
{
  var events = event.getEvents(START_DAY_TIME, END_DAY_TIME);

  if (!events)
  {
    Logger.log("Error trying to retrieve the events.");
    return;
  }

  for (var i = 0; i < events.length; i++)
  {
      if (events[i].getTitle() == taskTitle)
      {
        try
        {
          events[i].deleteEvent();
        }
        catch (e)
        {
          Logger.log("Error trying to delete event!");
        }
      }
  }
}


/*
 * Cleans things up for the next day. It unchecks all the checkboxes and updates the dates
 * according to when the tasks should be done next time.
 * This method is considered expensive, since it alters data in the sheet itself, because of
 * that it should only be used at the end of the day.
 */
function cleanup()
{
  var i = 4;

  while (spreadsheet.getRange("B" + i + ":B" + i).getValue())
  {
    var isCheckedCell = spreadsheet.getRange("A" + i + ":A" + i);
    var taskDateCell = spreadsheet.getRange("B" + i + ":B" + i);
    var taskTitleCell = spreadsheet.getRange("C" + i + ":C" + i);
    var taskPersonCell = spreadsheet.getRange("D" + i + ":D" + i);

    var isChecked = isCheckedCell.getValue();
    var taskDate = taskDateCell.getValue();
    var taskTitle = taskTitleCell.getValue();
    var taskPerson = taskPersonCell.getValue();

    if (isChecked)
    {
      isCheckedCell.setValue(false);
    }

    if (isTaskDueToToday(taskDate))
    {
      if (taskTitle == WEEKLY_TASK)
      {
        var nextWeekDate = new Date();
        nextWeekDate.setDate(nextWeekDate.getDate() + 7);
        taskDateCell.setValue(nextWeekDate);

        if (taskPerson == JOAO)
        {
          taskPersonCell.setValue(VITOR);
        }
        else if (taskPerson == MATT)
        {
          taskPersonCell.setValue(JOAO);
        }
        else
        {
          taskPersonCell.setValue(MATT);
        }
      }
      else
      {
        taskDateCell.setValue(NEXT_DAY_TIME);
      }
    }

    i++;
  }

  SpreadsheetApp.flush();
}


/*
 * Creates a customized Date object with the given parameters.
 * If any parameters don't follow the time format (hours between 0 and 24, and minutes and seconds between 0 and 60),
 * this method will return null to avoid exceptions.
 * 
 * 
 * @param  hours    a number in hours.
 * @param  minutes  a number in minutes.
 * @param  seconds  a number in seconds.
 * @return          the Date object with specific values for the time.
 */
function createTime(hours, minutes, seconds)
{
  if (hours < 0 || hours > 24 || minutes < 0 || minutes > 60 || seconds < 0 || seconds > 60)
  {
    return null;
  }

  var now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds, 00);
}


/*
 * Get the number of rows that contain tasks.
 * 
 * @return  the row number of the last task in the sheet.
 */
function getPositionOfLastTask()
{
  var i = 4;

  while (spreadsheet.getRange("B" + i + ":B" + i).getValue())
  {
    i++;
  }

  // Subtracting 1 because arrays are zero based.
  return i - 1;
}


/*
 * Checks if the task's date is the same as today's date.
 * 
 * @param   taskTimeString  a string in the Date format.
 * @return                  a boolean value indicating if the task's date is equal to today's date.
 */
function isTaskDueToToday(taskTimeString)
{
  var taskTime = new Date(taskTimeString);

  if (!taskTime)
  {
    Logger.log("Invalid date!");
    return false;
  }

  var now = new Date();

  var taskDate = taskTime.getDate() + "/" + taskTime.getMonth() + "/" + taskTime.getFullYear();
  var todaysDate = now.getDate() + "/" + now.getMonth() + "/" + now.getFullYear();

  return taskDate == todaysDate;
}


/*
 * Checks if today's day is a weekend.
 * 
 * @return   whether today's day is a weekend or not.
 */
function isCurrentDayAWeekend()
{
  var todaysDay = new Date().getDay();

  if (todaysDay == SUNDAY || todaysDay == SATURDAY)
  {
    return true;
  }

  return false;
}


/*
 * Checks if the event from the given parameters already exists.
 * If any errors happen when trying to get the events, it'll return true in order to not
 * create an event.
 * 
 * @param   event       a variable with the Calendar ID associated with a specific person.
 * @param   taskTitle   a title for the task.
 * @param   time        a variable of type Date.
 * @return              whether the event exists in the period of a day in the person's calendar or not.
 */
function eventExists(event, taskTitle, time)
{
  var events = event.getEvents(START_DAY_TIME, END_DAY_TIME);

  if (!events)
  {
    Logger.log("Error trying to retrieve the events.");
    return true;
  }

  for (var i = 0; i < events.length; i++)
  {
    if (events[i].getTitle() == taskTitle && events[i].getStartTime().getHours() == time.getHours())
    {
      return true;
    }
  }

  return false;
}
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1nx17ZaxrphRWD02PE3j58JpM7zs_wy7MlME3eTw6uHw/edit#gid=1386834576";
const MATT_ID = "h.teteu@gmail.com";
const VITOR_ID = "vitorriblacerda@gmail.com";
const JOAO_ID = "belfort.joao216@gmail.com";
const MATT = "Mateus";
const VITOR = "Vitor";
const JOAO = "João";

const WEEKLY_TASK = "Wash the toilet";

// Indexes of sheet's data.
const CHECKBOX_INDEX = 0;
const DATE_INDEX = 1;
const TASK_INDEX = 2;
const PERSON_INDEX = 3;

var MORNING_TIME = createTime(06, 30, 00);
var EVENING_TIME = createTime(12, 00, 00);
var NIGHT_TIME = createTime(18, 00, 00);

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

    if (!isCompleted && checkIfTaskIsDueToToday(taskTime))
    {
      getInformationFromSheet();
      return;
    }
  }

  Logger.log("All events completed.");
}


/*
 * Creates a specific Date object with the time defined by given parameters.
 */
function createTime(hours, minutes, seconds)
{
  var now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds, 00);
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

    if (taskTitle && !isCompleted && checkIfTaskIsDueToToday(taskDate))
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
 * Checks if the task's date is the same as today's date.
 */
function checkIfTaskIsDueToToday(taskTimeString)
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
 * Writes the event on the calendar.
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
      if (!checkIfEventExists(event, taskTitle, MORNING_TIME))
      {
        event.createEvent(taskTitle, MORNING_TIME, MORNING_TIME);
        Logger.log("Morning event created at " + MORNING_TIME);
      }
    }
    else if (hoursNow < EVENING_TIME.getHours())
    {
      if (!checkIfEventExists(event, taskTitle, EVENING_TIME))
      {
        deletePreviousEvent(event, taskTitle);

        event.createEvent(taskTitle, EVENING_TIME, EVENING_TIME);
        Logger.log("Evening event created at " + EVENING_TIME);
      }
    }
    else if (hoursNow < NIGHT_TIME.getHours())
    {
      if (!checkIfEventExists(event, taskTitle, NIGHT_TIME))
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
 * Checks if the event from the given parameters already exists.
 */
function checkIfEventExists(event, taskTitle, time)
{
  var events = event.getEvents(START_DAY_TIME, END_DAY_TIME);

  for (var i = 0; i < events.length; i++)
  {
    if (events[i].getTitle() == taskTitle && events[i].getStartTime().getHours() == time.getHours())
    {
      return true;
    }
  }

  return false;
}


/*
 * Deletes any previous events on the current day with the data equal to the given parameters.
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
 * Sets all the checkboxes in spreadsheet to false and updates the dates for the tasks.
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

    if (checkIfTaskIsDueToToday(taskDate))
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
 * Get the number of rows that contain tasks.
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
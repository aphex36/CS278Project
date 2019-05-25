'use strict';
function cs142FormatTime(date)
{
  //formattedDate will consist of the new date format
  var formattedDate = "";

  //Split the old date string by the spaces
  var dateComponents = date.toString().split(" ");
  var dayAbbreviation = dateComponents[0];
  var monthAbbreviation = dateComponents[1];
  var dayNumber = dateComponents[2];
  var year = dateComponents[3];
  var militaryTime = dateComponents[4];

  //Map the 3 letter abbreviations of days to their full names and add it to formattedDate
  switch(dayAbbreviation)
  {
    case "Mon":
      formattedDate += "Monday, ";
      break;
    case "Tue":
      formattedDate += "Tuesday, ";
      break;
    case "Wed":
      formattedDate += "Wednesday, ";
      break;
    case "Thu":
      formattedDate += "Thursday, ";
      break;
    case "Fri":
      formattedDate += "Friday, ";
      break;
    case "Sat":
      formattedDate += "Saturday, ";
      break;
    case "Sun":
      formattedDate += "Sunday, ";
      break;
  }


  //Map the 3 letter abbreviations of days to their full names and add it to formattedDate
  switch(monthAbbreviation)
  {
    case "Jan":
      formattedDate += "January ";
      break;
    case "Feb":
      formattedDate += "February ";
      break;
    case "Mar":
      formattedDate += "March ";
      break;
    case "Apr":
      formattedDate += "April ";
      break;
    case "May":
      formattedDate += "May ";
      break;
    case "Jun":
      formattedDate += "June ";
      break;
    case "Jul":
      formattedDate += "July ";
      break;
    case "Aug":
      formattedDate += "August ";
      break;
    case "Sep":
      formattedDate += "September ";
      break;
    case "Oct":
      formattedDate += "October ";
      break;
    case "Nov":
      formattedDate += "November ";
      break;
    case "Dec":
      formattedDate += "December ";
      break;
  }

  //Add the day and year
  formattedDate += parseInt(dayNumber) + ', ' + year + " ";

  //Convert military time to AM/PM
  var specificTime = militaryTime.split(":");
  var isAm;
  var hour = specificTime[0];
  var minutes = specificTime[1];

  //If hour is between 0 and 11, it's AM otherwise it's PM
  if(parseInt(hour) <= 11 && parseInt(hour) >= 0)
  {
    isAm = true;
  }
  else {
    isAm = false;
  }
  if(isAm)
  {
    //In the case of 0 for an hour, we want it to be displayed as 12, otherwise just add the number itself
    //11 would just get added and would be fine
    if(parseInt(hour) === 0)
    {
      formattedDate += 12 + ":" + minutes + " AM";
    }
    else {
      formattedDate += hour + ":" + minutes + " AM";
    }
  }
  else
  {
    //We took the hour and converted it to a 1-12 time again
    hour = (hour % 12);

    //Since hour is parsed to a number it lost the 0 padding (for example turned to 6 instead of 06)
    //Do this test for single digit hours and add the padding 0 in front if necessary
    if(hour < 10)
    {
      hour = "0" + hour;
    }

    formattedDate += hour + ":" + minutes + " PM";
  }

  //String is done formatting so return
  return formattedDate;
}

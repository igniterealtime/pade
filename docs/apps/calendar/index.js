
  $(document).ready(function() {

    document.getElementById("save-events").addEventListener("click", function(e)
    {
        e.stopPropagation();

        if (confirm(chrome.i18n.getMessage("plannerConfirm")))
        {
            var events = $('#calendar').fullCalendar("clientEvents");

            var planner = [];

            for (var i=0; i<events.length; i++)
            {
                var title = events[i].title;
                var allDay = events[i].allDay;
                var end = events[i].end ? events[i].end._d.toISOString() : null;
                var start = events[i].start._d.toISOString();

                console.log("Saving", title, start, end, allDay);
                planner.push({title: title, end: end, start: start, allDay: allDay});
            }

            window.localStorage["store.settings.savedPlanner"] = btoa(JSON.stringify(planner));
        }
    });

    document.getElementById("find-meeeting").addEventListener("click", function(e)
    {
        e.stopPropagation();

        var meetings = {};
        var encoded = window.localStorage["store.settings.savedMeetings"];
        if (encoded) meetings = JSON.parse(atob(encoded));

        var keyword = document.getElementById("searchText").value;
        var saveMeetings = Object.getOwnPropertyNames(meetings);
        var html = "<p/><p/><table><!--tr><th>Meeting</th><th style='text-align: right;'>Participants</th></tr-->";
        var saveMeetings = Object.getOwnPropertyNames(meetings);

        for (var i=0; i<saveMeetings.length; i++)
        {
            var meeting = meetings[saveMeetings[i]];
            var participants = "";

            for (var j=0; j<meeting.inviteList.length; j++)
            {
                participants = participants + meeting.inviteList[j] + "\n"
            }

            var newItem = "<tr><td><a class='fc-event' href='#' title='Drag and drop on calendar' id='invite-" + meeting.room + "'>" + meeting.invite + "@" + meeting.room + "</a></td><td style='text-align: right;'><a title='" + participants + "'>" + meeting.inviteList.length + " Participants</a></td></tr>";

            if (keyword.length == 0 || newItem.toLowerCase().indexOf(keyword.toLowerCase()) > -1)
            {
                html = html + newItem;
            }
        }

        document.getElementById("searchResults").innerHTML = html;

        $('.fc-event').each(function() {

          // store data so the calendar knows to render an event upon drop
          $(this).data('event', {
            title: $.trim($(this).text()), // use the element's text as the event title
            stick: true // maintain when user navigates (see docs on the renderEvent method)
          });

          // make the event draggable using jQuery UI
          $(this).draggable({
            zIndex: 999,
            revert: true,      // will cause the event to go back to its
            revertDuration: 0  //  original position after the drag
          });

        });

    }, false);



    var savedPlanner = [];
    var encoded = window.localStorage["store.settings.savedPlanner"];
    if (encoded) savedPlanner = JSON.parse(atob(encoded));


    $('#calendar').fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'agendaDay,agendaWeek,month'
        },
        events: savedPlanner,
        editable: true,
        droppable: true, // this allows things to be dropped onto the calendar
        dragRevertDuration: 0,
        drop: function() {
            //$(this).remove();
            //console.log("DROPPED", $(this).attr("id"));
        },
        eventDragStop: function( event, jsEvent, ui, view ) {

            if(isEventOverDiv(jsEvent.clientX, jsEvent.clientY))
            {
                $('#calendar').fullCalendar('removeEvents', event._id);
                console.log("removed", event._id, event);
            }
        }
    });


    var isEventOverDiv = function(x, y) {

        var external_events = $( '#meetings' );
        var offset = external_events.offset();
        offset.right = external_events.width() + offset.left;
        offset.bottom = external_events.height() + offset.top;

        // Compare
        if (x >= offset.left
            && y >= offset.top
            && x <= offset.right
            && y <= offset .bottom) { return true; }
        return false;

    }
  });

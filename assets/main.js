$(function () {
  var client = ZAFClient.init();
  client.invoke('resize', { width: '100%', height: '40vh' });
  client.get('ticket.customField:custom_field_11370232618653').then(function(data) { //replace with actual custom field value
  client.get('ticket.tags').then(async function (tagData) {
    var customFieldValue = data['ticket.customField:custom_field_11370232618653']; //replace with actual custom field value
    var tags = tagData['ticket.tags'];
    let freshdeskTicketId = null;
    let zendeskTicketId = null;
    let isNewTicket = true;
    let latestAddedNote = '';

  if (customFieldValue === 'yes') {
    if (tags.indexOf('neu_ticket') >= 0) { 
      client.get('ticket').then(function (ticketData) {
        let previousStatus = ticketData.ticket.status;
        let previousPriority = ticketData.ticket.priority;

        client.on('ticket.save', async function (e) {
          const ticket = await client.get('ticket');
          const status = ticket.ticket.status;
          const priority = ticket.ticket.priority;
          console.log(status);
          console.log(priority);
          const requestData = {};

          if (status !== previousStatus) {
            requestData["status"] = getStatusValue(status);
            console.log('Status changed to: ' + status);
            previousStatus = status;
          }

          if (priority !== previousPriority) {
            requestData["priority"] = getPriorityValue(priority);
            console.log('Priority changed to: ' + priority);
            previousPriority = priority;
          }

          if (tags.indexOf('escalated_fd_neu') >= 0) {
            requestData["group_id"] = 81000284399;
            console.log('Group ID updated to: 82000656361');
          }
          // if (Object.keys(requestData).length === 0) {
          //   // No changes in status, priority, or group ID, no need to send any payload
          //   return;
          // }

          const zendeskTicketData = await client.request({
            url: 'https://yourdomain.zendesk.com/api/v2/tickets/' + ticketData.ticket.id, //Replace yourdomain with actual zendesk domain
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            headers: {
              'Authorization': 'Basic ' + 'APIkey' //This is base64 encoded API key with combination email/token:APItoken
            },
          });

          if (zendeskTicketData && zendeskTicketData.ticket && zendeskTicketData.ticket.custom_fields) {
            const fdTicketId = zendeskTicketData.ticket.custom_fields.filter(field => field.id == "10001818213789");
            console.log(fdTicketId[0].value);

            if (fdTicketId) {
              const fdUpdateTicket = await fetch('https://yourdomain.freshdesk.com/api/v2/tickets/' + fdTicketId[0].value, { //Replace yourdomain with actual freshdesk domain
                method: 'PUT',
                headers: {
                  'Authorization': 'Basic ' + 'APIkey', //This is the base64 encoded api key from freshdesk
                  "Content-Type": 'application/json',
                },
                body: JSON.stringify(requestData)
              });

              // Check if there's a reply or internal note added to the ticket
              if (fdUpdateTicket.ok) {
                const ticketEvents = await client.request({
                  url: 'https://yourdomain.zendesk.com/api/v2/tickets/' + ticketData.ticket.id + '/audits',
                  type: 'GET',
                  dataType: 'json',
                  contentType: 'application/json',
                  headers: {
                    'Authorization': 'Basic ' + 'APIkey'
                  },
                });
                console.log(ticketEvents);

                // Find the latest event (reply or internal note)
                const latestEvent = ticketEvents.audits.reverse().find(event =>
                  event.events.some(event => event.type === 'Comment' || event.type === 'Internal Note')
                );

                if (latestEvent) {
                  let latestEventText = '';
                for (const event of latestEvent.events) {
                  if (event.type === 'Comment' || event.type === 'Internal Note') {
                    latestEventText = event.body;
                    console.log(latestEventText);
                    break; // Exit the loop once the first event with 'Comment' or 'Internal Note' type is found
                  }
                }
                  console.log(latestEventText);

                  if (latestEventText === latestAddedNote) {
                    console.log('Note already added to Freshdesk');
                    return true;
                  }

                  // Create a note or reply on the Freshdesk ticket
                  const fdNote = await fetch('https://yourdomain.freshdesk.com/api/v2/tickets/' + fdTicketId[0].value + '/notes', {
                    method: 'POST',
                    headers: {
                      'Authorization': 'Basic ' + 'APIkey',
                      "Content-Type": 'application/json',
                    },
                    body: JSON.stringify({
                      body: latestEventText
                    })
                  });

                  if (fdNote.ok) {
                    // Update the latestAddedNote variable
                    latestAddedNote = latestEventText;
                    return true;
                  }
                }
              }
            }
          }

          // If no changes in status, priority, or group ID, add a note with the latest comment
          if (Object.keys(requestData).length === 0) {
            if (zendeskTicketData && zendeskTicketData.ticket && zendeskTicketData.ticket.custom_fields) {
            const fdTicketId = zendeskTicketData.ticket.custom_fields.filter(field => field.id == "10001818213789");
            console.log(fdTicketId[0].value);

            const ticketEvents = await client.request({
                  url: 'https://yourdomain.zendesk.com/api/v2/tickets/' + ticketData.ticket.id + '/audits',
                  type: 'GET',
                  dataType: 'json',
                  contentType: 'application/json',
                  headers: {
                    'Authorization': 'Basic ' + 'APIkey'
                  },
                });
                console.log(ticketEvents);

                // Find the latest event (reply or internal note)
                const latestEvent = ticketEvents.audits.reverse().find(event =>
                  event.events.some(event => event.type === 'Comment' || event.type === 'Internal Note')
                );

                if (latestEvent) {
                  let latestEventText = '';
              for (const event of latestEvent.events) {
                if (event.type === 'Comment' || event.type === 'Internal Note') {
                  latestEventText = event.body;
                  console.log(latestEventText);
                  break; // Exit the loop once the first event with 'Comment' or 'Internal Note' type is found
                }
              }
                  console.log(latestEventText);

                  if (latestEventText === latestAddedNote) {
                    console.log('Note already added to Freshdesk');
                    return true;
                  }

            // Create a note on the Freshdesk ticket
            const fdNote = await fetch('https://yourdomain.freshdesk.com/api/v2/tickets/' + fdTicketId[0].value + '/notes', {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + 'APIkey',
                "Content-Type": 'application/json',
              },
              body: JSON.stringify({
                body: latestEventText
              })
            });

            if (fdNote.ok) {
              // Update the latestAddedNote variable
              latestAddedNote = latestEventText;
              return true;
            }
          }
          }
        }

          return Promise.reject("Something went wrong");
        });
      });
    } 
    else {
      client.get('ticket').then(function (ticketData) {
        var description = ticketData.ticket.description;
        var subject = ticketData.ticket.subject;
        var email = ticketData.ticket.requester.email;
        document.getElementById('descriptionInput').value = description;
        document.getElementById('subjectInput').value = subject;
        document.getElementById('emailInput').value = email;

        
        // Listen to the ticket save event
        client.on('ticket.save', async function (e) {
          try {
            const ticket = await client.get('ticket');
            const priority = ticket.ticket.priority;
            const status = ticket.ticket.status;
            console.log(status);
            console.log(priority);
            const cc_emails = ["user@gmail.com"]; // Convert comma-separated string to array
            const requestData = {
              "description": description,
              "subject": subject,
              "email": email,
              "priority": getPriorityValue(priority),
              "status": getStatusValue(status),
              "group_id": 81000298151,
              "source": 109,
              "cc_emails": cc_emails,
              "tags": ["neu_ticket"], // Add "neu_ticket" tag to the new ticket
              "custom_fields": {
                "cf_tata_neu_category": "WS: Brand Related",
                "cf_tata_neu_sub_category": "App / Website Related",
                "cf_tata_neu_sub_category1": "Unable to add product in cart/checkout"
              }
            };

            // create freshdesk ticket
            const freshdeskTicket = await client.request({
              url: 'https://yourdomain.freshdesk.com/api/v2/tickets/',
              type: 'POST',
              dataType: 'json',
              contentType: 'application/json',
              headers: {
                'Authorization': 'Basic ' + 'APIkey',
              },
              data: JSON.stringify(requestData)
            });

            freshdeskTicketId = freshdeskTicket.id;
            zendeskTicketId = ticketData.ticket.id;
          } catch (err) {
            console.log(err);
            return Promise.reject("Something went wrong");
          }
          location.reload();
        });
      });

      client.on('ticket.submit.done', async () => {
        try {
          const zendeskTicketUpdate = await client.request({
            url: 'https://yourdomain.zendesk.com/api/v2/tickets/' + zendeskTicketId + '.json',
            type: 'PUT',
            dataType: 'json',
            contentType: 'application/json',
            headers: {
              'Authorization': 'Basic ' + 'APIkey'
            },
            data: JSON.stringify({
              "ticket": {
                "custom_fields": [
                  {
                    "id": "10001818213789",
                    "value": freshdeskTicketId
                  }
                ]
              }
            })
          });
          return zendeskTicketUpdate;
        } catch (err) {
          return Promise.reject("Something went wrong");
        }
      });
    }
    }else{
      console.log("error");
    }
    });//2nd
  }); //first

  // Function to map status values
  function getStatusValue(status) {
    switch (status) {
      case 'new':
        return 2;
      case 'open':
        return 2;
      case 'pending':
        return 12;
      case 'solved':
        return 4;
      default:
        return null;
    }
  }

  // Function to map priority values
  function getPriorityValue(priority) {
    switch (priority) {
      case 'urgent':
        return 4;
      case 'high':
        return 3;
      case 'normal':
        return 2;
      case 'low':
        return 1;
      default:
        return null;
    }
  }
});

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#mailbox-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#compose-view-error').innerHTML = '';

  document.querySelector('#compose-form').onsubmit = function () {

  let r = `${document.querySelector('#compose-recipients').value}`;
  let s = `${document.querySelector('#compose-subject').value}`;
  let b = `${document.querySelector('#compose-body').value}`;

  fetch('emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: r,
      subject: s,
      body: b,
    }),
  })
  .then(response => response.json())
  .then(result => {
    if (result.error) {
      document.querySelector('#compose-view-error').innerHTML = result.error;
    }
    else {
      load_mailbox('sent');
    }
    });
  return false;
};
};

function load_mailbox(mailbox) {

  console.log(mailbox);
  
  // Show the mailbox and hide other views
  document.querySelector('#mailbox-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#mailbox-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    if (emails['error']) {
      const error_div = document.createElement('div');
      error_div.className = 'error';
      error_div.innerHTML = emails['error'];

      document.querySelector('#mailbox-view').append(error_div);
    } else {
      emails.forEach(add_email);
    }
  });
};

function add_email(email) {
  const email_div = document.createElement('div');
  email_div.className = 'row';
  email_div.id = email['id'];
  if (email['read']) {
    email_div.style.backgroundColor = 'lightgray';
  }
  let content = `<div class='col'><strong>${email['sender']}:</strong></div> <div class='col-6'>${email['subject']}</div><div class='col'><i>${email['timestamp']}</i></div>`;
  email_div.innerHTML = content;
  document.querySelector('#mailbox-view').append(email_div);
  email_div.addEventListener('click', load_email);
};


//show individual email
function load_email() {
  //activating appropriate div
  document.querySelector('#mailbox-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  //clear the div
  document.querySelector('#email-view').innerHTML = '';

  //requesting the email
  fetch(`/emails/${this.id}`)
  .then(response => response.json())
  .then(email => {
    // request failed
    if (email['error']) {
      const email_error = document.createElement('div');
      email_error.id = 'email-error';
      document.querySelector('#email-error').innerHTML = email['error'];
      document.querySelector('#email-view').append(email_error);
    } else {
      // request success
      const email_div = document.createElement('div');
      email_div.className = 'email';
      email_div.id = email['id'];

      let btn = '';
      let header = `<p><strong>From:</strong> ${email['sender']}</p><p><strong>To:</strong> ${email['recipients']}</p><p><strong>Subject:</strong> ${email['subject']}</p><p><strong>Timestamp:</strong> ${email['timestamp']}</p>`;
      let buttons = `<button class="btn btn-sm btn-outline-primary" id="reply">Reply</button><button class="btn btn-sm btn-outline-primary" id="reply-all">Reply to All</button>`;
      if (email.archived) {
        buttons = buttons + `<button class="btn btn-sm btn-outline-primary" id="unarchive">Unarchive</button>`;
        btn = 'unarchive';
      } else {
        buttons = buttons + `<button class="btn btn-sm btn-outline-primary" id="archive">Archive</button>`;
        btn = 'archive';
      }
      let body = `<hr><p>${email['body']}</p>`;

      let content = header + buttons + body;

      // marking email as read
      if (!email.read) {
      fetch(`emails/${email['id']}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      });
    }
      email_div.innerHTML = content;
      document.querySelector('#email-view').append(email_div);

      document.querySelector(`#${btn}`).addEventListener('click', () => {
        let boolarchive;
        if (btn === 'archive') {
          boolarchive = true;
        } else {
          boolarchive = false;
        }
        console.log(email);
        fetch(`emails/${email.id}`, {
          method : "PUT",
          body : JSON.stringify({
            archived: boolarchive,
          }) 
        })
        .then(reposnse => {
          if (btn === 'archive') {
              load_mailbox('archive');
            } else {
              load_mailbox('inbox');
            }
        })
      });


      document.querySelector('#reply-all').addEventListener('click', () => replyAll_mail(email));
      document.querySelector('#reply').addEventListener('click', () => reply_mail(email));
    }
  });
};


function reply_mail(email) {

  console.log(email);
    // Show compose view and hide other views
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#mailbox-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition
  let reci=email.sender;
  let sub = email.subject;
  if (sub.slice(0, 3) !== 'Re:') {
    sub = 'Re:' + sub;
  }
  let bod = `On ${email.timestamp} ${email.sender} wrote:\n ${email.body}`;
  document.querySelector('#compose-recipients').value = reci;
  document.querySelector('#compose-subject').value = sub;
  document.querySelector('#compose-body').value = bod;
  document.querySelector('#compose-view-error').innerHTML = '';

  document.querySelector('#compose-form').onsubmit = function () {

  let r = `${document.querySelector('#compose-recipients').value}`;
  let s = `${document.querySelector('#compose-subject').value}`;
  let b = `${document.querySelector('#compose-body').value}`;

  fetch('emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: r,
      subject: s,
      body: b,
    }),
  })
  .then(response => response.json())
  .then(result => {
    if (result.error) {
      document.querySelector('#compose-view-error').innerHTML = result.error;
    }
    else {
      load_mailbox('sent');
    }
    });
  return false;
};


};



function replyAll_mail(email) {

  console.log(email);
    // Show compose view and hide other views
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#mailbox-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition 
  let sender = document.querySelector('#compose-sender').value;
  let recipients = [];
  if (email.sender !== sender) {
    recipients = recipients.push(email.sender);
  }

  email.recipients.forEach(recipient => {
    if (recipient !== sender) {
      recipients.push(recipient);
    }
  });

  let reci='';
  for (var i = 0; i<recipients.length; i++) {
    if (i>0) {
      reci = reci + ',';
    }
    reci = reci + recipients[i];
  }

  let sub = email.subject;
  if (sub.slice(0, 3) !== 'Re:') {
    sub = 'Re:' + sub;
  }

  let bod = `On ${email.timestamp} ${email.sender} wrote:\n ${email.body}`;
  document.querySelector('#compose-recipients').value = reci;
  document.querySelector('#compose-subject').value = sub;
  document.querySelector('#compose-body').value = bod;
  document.querySelector('#compose-view-error').innerHTML = '';

  document.querySelector('#compose-form').onsubmit = function () {

  let r = `${document.querySelector('#compose-recipients').value}`;
  let s = `${document.querySelector('#compose-subject').value}`;
  let b = `${document.querySelector('#compose-body').value}`;

  fetch('emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: r,
      subject: s,
      body: b,
    }),
  })
  .then(response => response.json())
  .then(result => {
    if (result.error) {
      document.querySelector('#compose-view-error').innerHTML = result.error;
    }
    else {
      load_mailbox('sent');
    }
    });
  return false;
};

};
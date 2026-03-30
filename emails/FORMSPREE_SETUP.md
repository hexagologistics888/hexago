# Formspree Email Setup

Use these templates in Formspree to make the notification email and the customer confirmation email look branded and professional.

Files in this folder:

- `formspree-notification-template.html`
- `formspree-autoresponse-template.html`

Recommended Formspree setup:

1. Keep the website forms sending to your existing Formspree endpoint.
2. In Formspree, move the form into a project if it is not already inside one.
3. For the email you receive:
   - Go to `Project Settings -> Templates`
   - Create a new `Submission Notification` template
   - Paste `formspree-notification-template.html` into the HTML tab
4. For the customer confirmation email:
   - Go to the form `Workflow` or `Plugins -> Autoresponses`
   - Set:
     - From name: `Hexago Logistics`
     - Subject: `Thank you for contacting Hexago Logistics`
     - Message/template: use `formspree-autoresponse-template.html`

Important Formspree plan limits from the official docs:

- Autoresponse emails are available on `Professional` and `Business` plans.
- Custom email templates are available on the `Business` plan.
- If you want the autoresponse to come from your own domain instead of `@formspree.io`, add and verify your domain in Formspree.
- Submission notification templates must include the `{{ _unsubscribe }}` token.
- Autoresponse templates should rely on `{{ submission_message }}` and `{{ _time }}`. Form field values are not reliably available there.

Suggested autoresponse copy if you do not use the full HTML template:

`Thank you for contacting Hexago Logistics. Your message has been received successfully. One of our team members or partners will review it and contact you shortly.`

Official references:

- https://help.formspree.io/hc/en-us/articles/360025007233-Sending-a-confirmation-or-response-email
- https://help.formspree.io/hc/en-us/articles/360056230434-Setting-Custom-Email-Templates
- https://help.formspree.io/hc/en-us/articles/1500000941722-Setting-Email-Domain

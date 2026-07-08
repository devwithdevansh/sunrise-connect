async function test() {
  const WHATSAPP_PHONE_NUMBER_ID = '1208213392376965';
  const WHATSAPP_API_TOKEN = 'EAAcswpNsmysBR9dZBEq82EFl5gdyzaEdolYu5ZCYXMGsHPUALkn7idV9qLLHWsX5F0mlRSMIIULl8d7QLpgRB9ZB2yMZAMYqEmXNiCsSvN92ttw6fkaFi4a4KCpiu2vtbfgpZAmVaZBor2rBH1lQvMZC98ADNSVrGM4qZCKFegZBQa1joW3pMA7uXkHmhLOUKjGufOqR3zZCmJ0mhCxn2ZALOgzuUYCcocVsEPsAhL9C2lXY5CA2YdSgRPw6YvEaLEB8wWScjR0aZBNanQZCmQng3GitXLq8ZD';
  // Use a random valid number or just test if we get an auth error vs a validation error
  const to = '919999999999';

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: 'hello_world',
      language: { code: 'en_US' }
    }
  };

  try {
    const url = `https://graph.facebook.com/v25.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    console.log("Fetching: " + url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const json = await response.json();
    console.log("Status:", response.status);
    console.log(JSON.stringify(json, null, 2));
  } catch(e) {
    console.error("Error:", e);
  }
}

test();

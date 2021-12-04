const randomNames = [
  "Drew Thompson",
  "Sabrina Sutton",
  "Julie Reynolds",
  "Rodolfo Oliver",
  "Lynette Morales",
  "Ann Gutierrez",
  "Walter Little",
  "Anita Goodwin",
  "Shaun Andrews",
  "Cary Sharp",
];

const randomSentences = [
  "We made it to the club.",
  "It could be the biggest mistake you ever make.",
  "I added his name to the book.",
  "The girl in red is his girlfriend.",
  "Blue candies are more tasty than orange candies.",
  "Laken bought a computer at thirty percent off the list price.",
  "Her handbag matches her clothes perfectly.",
  "Many trees are in the forest.",
  "Tom asked me if he was invited to the party.",
  "I got my hair cut today and they did it way too short.",
  "They’re as different as night and day.",
  "Rosa likes tea better than coffee.",
  "Why would he go to all that effort for a free pack of ranch dressing?",
  "Ridiculous!",
  "He liked chocolate and banana milkshakes because his mom used to make them when he was sick.",
];

export const getLatestMessages = (meId) => {
  return randomNames.map((i, name) => {
    return {
      otherId: i,
      otherName: name,
      latestMessage: message(
        i,
        "latest message" + i,
        meId,
        Math.floor(Date.now() / 1000)
      ),
    };
  });
};

export const getMessageData = (personOneId, personTwoId) => {
  let convo = [];
  randomNames.forEach((i, name) => {
    for (let i = 0; i < 5; i++) {
      const randomMessage =
        randomSentences[Math.floor(Math.random() * randomSentences.length)];
      let senderId = personTwoId;
      let recieverId = personOneId;
      if (Math.round(Math.random()) == 1) {
        senderId = personOneId;
        recieverId = personTwoId;
      }
      convo.push(
        message(
          i,
          randomMessage,
          senderId,
          recieverId,
          Math.floor(Date.now() / 1000)
        )
      );
    }
  });

  console.log(convo);
  return convo;
};

const message = (
  id,
  body,
  sender_id,
  receiver_id,
  created_at,
  read = false
) => {
  return {
    id,
    body,
    sender_id,
    receiver_id,
    created_at,
    read,
  };
};

export const helpCommand = async (ctx) => {
  const message = `
🤖 *DVIZH BISHKEK BOT* 🤖

Я помогаю управлять движухой в Бишкеке!

*КОМАНДЫ:*
/top — Топ-20 движняков по репутации
/stats — Твоя статистика
/event — Ближайшие события
/help — Это сообщение

*РЕПУТАЦИЯ:*
Отвечай на сообщения словами:
- +реп
- спасибо
- +

Ограничения:
- 1 раз в 8 часов от одного человека
- Максимум 10 репутаций в сутки

*САЙТ:*
${process.env.SITE_URL}
`;
  
  ctx.replyWithMarkdown(message);
};
<%*
////
const review_strategy = {Focus_on: 'evaluation, goal-setting, analysis of strengths and weaknesses, developing actionable recommendations'};
const meta = {
//    model: 'x-ai/grok-4',
    model: 'deepseek/deepseek-chat'
}
////
const selection = tp.file.selection() || '';
const client = tp.user.client;
const {placeholder} = client.config();
let updText = selection;
const calcAIFunction = async () => {
    const content = selection;
    const content_topic = tp.file.title;
    const review_strategy2 = client.strProperties(review_strategy);    
    const examples = null;
    const response = await client.objective_expert_review(
      tp,
      content,
      content_topic,
      review_strategy2,
      examples,
      meta
    );
    if (response.status === 200) {
      //console.log(`result: ${tp.user.client.strJson(response.json)}`)
      if (response.json.result?.other_notes) {
        console.log(`other_notes: ${response.json.result.other_notes}`)
      }      
      return response.json.result.review_text
    }
}

if (selection.length > 0) {
  if (selection.includes(placeholder)) {  
    updText = selection.replace(placeholder, await calcAIFunction());
  } else {  
    updText = selection.trim() + '\n' + (await calcAIFunction()) + '\n';
  }
} else {    
    new Notice().noticeEl.append(createEl("strong", { text: "No selection" }));
}
tp.file.cursor_append(updText)
-%>

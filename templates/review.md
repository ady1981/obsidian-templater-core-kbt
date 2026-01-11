<%*
////
const review_strategy = 'Focus_on: evaluation, goal-setting, analysis of strengths and weaknesses, developing actionable recommendations';
////
const selection = tp.file.selection() || '';
const {placeholder} = tp.user.client.config();
let updText = selection;
const calcAIFunction = async () => {
    const content = selection;
    const content_topic = tp.file.title;
    const review_strategy2 = review_strategy;
    const examples = null;
    const response = await tp.user.client.objective_expert_review(
      tp,
      content,
      content_topic,
      review_strategy2,
      examples
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

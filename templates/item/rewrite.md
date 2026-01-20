<%*
////
const aspects_to_keep = [
  'Primary aspects'
];
const aspects_to_change = {
//  'Target_language': 'English'
}
////
const client = tp.user.client;
const selection = tp.file.selection() || '';
let updText = selection;
const formatAIResult = (c) => c.rewritten_item;
const calcAIFunction = async () => {
    const content = selection;
    const content_topic = tp.file.title;
    const extra_output_specification = null;
    const transformation_constraints = client.maybeWithHeader(aspects_to_keep.join(', '), 'Aspects_to_keep') 
      + '\n' + client.maybeWithHeader(client.strProperties(aspects_to_keep), 'Aspects_to_change');
    const examples = null;
    const response = await client.constrained_rewriting(tp, content, content_topic, extra_output_specification, transformation_constraints, examples);
    if (response.status === 200) {
      //console.log(client.strJson(response.json))
      if (response.json.result?.other_notes) {
        console.log(`other_notes: ${response.json.result.other_notes}`)
      }      
      return formatAIResult(response.json.result)
    }
}

if (selection.length > 0) {
  updText = selection.trim() + '\n' + (await calcAIFunction()) + '\n';
} else {    
    new Notice().noticeEl.append(createEl("strong", { text: "No selection" }));
}
tp.file.cursor_append(updText)
-%>

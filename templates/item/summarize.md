<%*
////
const summarizing_strategy = {
  Summary_should_be: 'abstract and express the most valued hint, no longer than 1 sentence',
  Split_strategy: 'split complex sentence into list items'
};
const examples = `## Summarizing strategy
...
## Content domain
Innovative ideas
## Content
...
## Response
\`\`\`yaml
summary: |
  The next-generation development platform must integrate seamless:
    * AI assistance,
    * ultra-fast semantic understanding via LSP,
    * zero-configuration support for reproducible environments.
\`\`\``;
////
const client = tp.user.client;
const selection = tp.file.selection() || '';
const {placeholder} = tp.user.client.config();
let updText = selection;
const calcAIFunction = async () => {
    const content = tp.user.client.removeLineWithPlaceholder(selection);
    const content_topic = tp.file.title;    
    const summarizing_strategy2 = client.strProperties(summarizing_strategy);
    const response = await tp.user.client.abstractive_summarize(
      tp,
      content,
      content_topic,
      summarizing_strategy2,
      examples      
    );
    if (response.status === 200) {
      if (response.json.result?.other_notes) {
        console.log(`other_notes: ${response.json.result.other_notes}`)
      }      
      return response.json.result.summary
    }
}

if (selection.length > 0) {
  if (selection.includes(placeholder)) {  
    updText = selection.replace(placeholder, await calcAIFunction());
  } else {  
    updText = selection.trim() + '\n' + (await calcAIFunction()).trim() + '\n';
  }
} else {    
    new Notice().noticeEl.append(createEl("strong", { text: "No selection" }));
}
tp.file.cursor_append(updText)
-%>

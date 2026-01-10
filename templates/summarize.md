<%*
const selection = tp.file.selection() || '';
const {placeholder} = tp.user.client.config();
let updText = selection;
const calcAIFunction = async () => {
    const content = tp.user.client.removeLineWithPlaceholder(selection);
    const content_domain = tp.file.title;
    const summarizing_strategy = `* The summary should be abstract and express the most valued hint.  
* It should be no longer than 1 sentence. 
* Split complex sentence into list items.`;
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
    const response = await tp.user.client.abstractive_summarize(
      tp,
      content,
      content_domain,
      summarizing_strategy,
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

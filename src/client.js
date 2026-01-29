const config = {
    aiFunctionsBaseURL: 'http://127.0.0.1:5001',
    aiFunctionsAPIToken: 'xxx',
    responseLanguage: 'Russian',
    emptyValueMark: '--',
    placeholder: '{{}}',
    itemsSeparator: '\n',
    itemsBullet: '- ',
    itemsIndent: '  ',
    disjointnessScoreThreshold: 0.9,
    referencePropName: 'reference',
    contentCodeBlockBackticks: '~~~',
    langPropertyName: 'Output_content_language'
}


function strJson(obj) {
    return JSON.stringify(obj, null, 2)
}    

function strProperties(obj) {
    if (! obj) { return '' }
    return Object.entries(obj)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
}

function isNotEmpty(strOrList) {
    return strOrList && strOrList.length > 0;
}

function isEmpty(strOrList) {
    return !strOrList || strOrList.length == 0;
}

function removeLineWithPlaceholder(text) {
    if (!text) {
        return text;
    }
    const lines = text.split('\n');
    const filteredLines = lines.filter(line => !line.includes(config.placeholder));
    return filteredLines.join('\n');
}

function withLanguageOutputSpecification(extra_output_specification) {
    if ((extra_output_specification || '').includes(`${config.langPropertyName}:`)) {
        return extra_output_specification
    } else {
        const lang_output_specification = strProperties({[config.langPropertyName]: config.responseLanguage})
        const extra_output_specification2 = isNotEmpty(extra_output_specification) ?
          lang_output_specification + '\n' + extra_output_specification :
          lang_output_specification;
        return extra_output_specification2
    }
}

function encodeInMarkdown(codeText, lang = 'md') {
    return `${config.contentCodeBlockBackticks}${lang}\n${codeText}\n${config.contentCodeBlockBackticks}\n`
}

function maybeWithHeader(value, header, headingLevel = 1) {
    return value ?
       `${'#'.repeat(headingLevel)} ${header}\n${value}` :
       ''
}

const isString = (value) => typeof value === "string";

const normalizeUnicodeText = (text) => isString(text) ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : text;

const sanitizeText = (text) => isString(text) ? normalizeUnicodeText(text).trim().replace(/\s+/g, '-') : text; 

function getOrDefault(obj, key, defaultValue) {
  return obj[key] ?? defaultValue;
}

function strPrimaryProperty(keyPath, value, opts) {
    const keyStr = keyPath.filter(c => c).map(c => opts?.sanitizeText ? sanitizeText(c) : c).join('.');
    return `[**${keyStr}**:: ${opts?.normalizeText ? normalizeUnicodeText(value) : value}]`
}

function strSecondaryProperty(keyPath, value, opts) {
    const keyStr = keyPath.filter(c => c).map(c => opts?.sanitizeText ? sanitizeText(c) : c).join('.');
    return `[${keyStr}:: ${opts?.normalizeText ? normalizeUnicodeText(value) : value}]`
}

function formatAsList(items, ident = '') {
    return formatTextsAsList(items.map(c => c.item), ident)
}

function formatTextsAsList(texts, ident = '') {
    return texts.map(c => `${ident}${config.itemsBullet}${c}`).join('\n')
}

function formatAsText(items, ident = '') {
    return isEmpty(items) ? config.emptyValueMark : items.map(c => `${ident}${c?.item}`).join('\n')
}

function formatFactualQA(result) {
    return result.items.map(({answer_text, answer_references}) => {
      const refsStr = answer_references.map((c, idx) => `${config.itemsIndent}${config.itemsBullet}[${config.referencePropName}.${idx + 1}:: ${c?.reference_text}${c?.reference_type === 'internal_knowledge' ? ' // internal knowledge' : ''}]`)
        .join('\n');
      return `${config.itemsBullet}${answer_text}\n${refsStr}`
      })
      .join('\n')
}

function calcProperties(aspect, opts) {
    return aspect.features.reduce(({occurs, result}, feature) => {
        occurs[feature.feature_name] = getOrDefault(occurs, feature.feature_name, 0) + 1;
        const idxItem = occurs[feature.feature_name] >= 2 ? occurs[feature.feature_name] : null;
        const updResult = [...result,
            aspect?.is_primary_aspect ?
            strPrimaryProperty((aspect.elementary_aspect_name !== feature.feature_name) ? 
                [aspect.elementary_aspect_name, feature.feature_name, idxItem] :
                [aspect.elementary_aspect_name, idxItem]
                , feature.feature_elementary_value, opts) :
            strSecondaryProperty((aspect.elementary_aspect_name !== feature.feature_name) ? 
              [aspect.elementary_aspect_name, feature.feature_name, idxItem] :
              [aspect.elementary_aspect_name, idxItem]
              , feature.feature_elementary_value, opts)];
        return {occurs, result: updResult}
        }, {occurs: {}, result: []})
      .result
}

function formatAspectAnalysisResult(result, opts = {sanitizeText: false, normalizeText: true}) {    
    return formatTextsAsList(result.by_aspects.flatMap(c => calcProperties(c, opts)));
}

function formatAspectRewriteResult(result, opts = {sanitizeText: false, normalizeText: true}) {
    const propertiesStr = formatTextsAsList(result.changed_aspects.flatMap(c => calcProperties(c, opts)));
    return result.rewritten_item + '\n' + propertiesStr;
}

function formatDifferenceResult(result, items, opts = {sanitizeText: true, normalizeText: false}) {
  const leftLines = result.by_aspects.flatMap(aspect =>
    aspect.features.map(feature =>
        aspect?.is_primary_aspect ?
          strPrimaryProperty([aspect.elementary_aspect_name, feature.feature_name], feature.left_item_elementary_value, opts) :
          strSecondaryProperty([aspect.elementary_aspect_name, feature.feature_name], feature.left_item_elementary_value, opts)
    )
  );
  const rightLines = result.by_aspects.flatMap(aspect =>
    aspect.features.map(feature =>
        aspect?.is_primary_aspect ?
          strPrimaryProperty([aspect.elementary_aspect_name, feature.feature_name], feature.right_item_elementary_value, opts) :
          strSecondaryProperty([aspect.elementary_aspect_name, feature.feature_name], feature.right_item_elementary_value, opts)
    )
  );
  return `# Difference
## ${items[0]}

${leftLines.join('\n')}

## ${items[1]}

${rightLines.join('\n')}
`;
}

function formatItemGeneration({new_disjoint_items}, opts = {normalizeText: false}) {
    const new_disjoint_items2 = isEmpty(new_disjoint_items) ?
      [] :
      new_disjoint_items.filter(c => c.item_disjointness_score && (typeof c.item_disjointness_score === 'number') && c.item_disjointness_score >= config.disjointnessScoreThreshold);
    if (isEmpty(new_disjoint_items2)) {
        //console.log('empty item generation result');
        return config.emptyValueMark;
    }
    return new_disjoint_items2
      .map(c => c?.item_value)
      .map(c => opts?.normalizeText ? normalizeUnicodeText(c) : c)
      .join('\n')
}

function withContentSection(originMdText, content_header, headingLevel, content, contentLang = 'md') {    
    const contentStr = maybeWithHeader(encodeInMarkdown(content, contentLang), content_header, headingLevel);
    if (isNotEmpty(originMdText)) {
        return originMdText + '\n' + contentStr
    } else {
        return contentStr
    }
}

function withSection(originMdText, text_header, headingLevel, text) {
    const contentStr = maybeWithHeader(text, text_header, headingLevel);
    if (isNotEmpty(originMdText)) {
        return originMdText + '\n' + contentStr
    } else {
        return contentStr
    }
}


async function generate(tp, task_specification, target_semantic_specification, context_knowledge_topic, extra_context_knowledge_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {
    const target_specification = [maybeWithHeader(task_specification, 'Task specification', 2), maybeWithHeader(target_semantic_specification, 'Target semantic specification', 2)]
          .filter(isNotEmpty)
          .join('\n')
          .trim();
    const context_knowledge_specification = [maybeWithHeader(context_knowledge_topic, 'Context knowledge topic', 3), extra_context_knowledge_specification]
          .filter(isNotEmpty)
          .join('\n')
          .trim();
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification) + '\n';
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/generate`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            target_specification,
            context_knowledge_specification,
            _extra_information_retrieval_strategy: maybeWithHeader(extra_information_retrieval_strategy, 'Extra information retrieval strategy', 2),
            _output_generation_strategy: maybeWithHeader(output_generation_strategy, 'Output generation strategy'),
            _extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            meta      
        })
    }
    //console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

async function custom_generate(customAIFunction, customData, tp, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);    
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/${customAIFunction}`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({...customData,        
            _target_semantic_specification: maybeWithHeader(target_semantic_specification, 'Target semantic specification', 2),
            context_knowledge_specification: maybeWithHeader(knowledge_topic, 'Knowledge topic', 3),
            _extra_information_retrieval_strategy: maybeWithHeader(extra_information_retrieval_strategy, 'Extra information retrieval strategy', 2),
            _output_generation_strategy: maybeWithHeader(output_generation_strategy, 'Output generation strategy'),
            _extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            meta      
        })
    }
    //console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

function factual_question_answering(tp, question, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {    
  return custom_generate('factual_question_answering', {question}, tp, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta)
}

function aspected_analise(tp, content, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {    
    return custom_generate('aspected_analise', {content}, tp, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta)
}

function aspected_rewrite(tp, content, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {    
    return custom_generate('aspected_rewrite', {content}, tp, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta)
}


module.exports = {
    // utils
    config: () => config,
    strJson,
    strProperties,    
    isNotEmpty,
    isEmpty,
    removeLineWithPlaceholder,
    maybeWithHeader,
    encodeInMarkdown,
    withSection,
    withContentSection,
    // formaters
    formatAsList,
    formatAsText,
    formatFactualQA,
    formatAspectAnalysisResult,
    formatAspectRewriteResult,
    formatDifferenceResult,
    formatItemGeneration,
    // API helpers
    generate,
    factual_question_answering,
    aspected_analise,
    aspected_rewrite
}

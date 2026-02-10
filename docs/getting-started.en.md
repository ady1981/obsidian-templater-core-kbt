## What is the core-kbt mini-framework

### Motivation for the project

Let's formulate the current general problems and motivation for the project in the form of theses:
* - **Description**: LLMs are trained on natural language
  - **Problem and what can be done**: natural language is extremely inconvenient for programming, so a "toolkit" is needed that will "translate" task requirements into semi-natural language so that (a) the LLM unambiguously "understands" the task precisely, (b) the LLM returns the answer in the expected format.
  - **What currently exists in core-kbt**:
      1. AI-functions for precise task transfer to LLM and obtaining an answer in a given flexible structure
      2. for Obsidian: precise expandable generation control through aspects defined in the Templater template
* - **Description**: Current LLMs are limited: (a) in the number of their internal computations, (b) in the size of "memory" for executing their "algorithms", (c) **in the instability of algorithm quality with different input data characteristics**, (d) **due to the features and artifacts present in the training sample**, and as a result, (e) **in the absence of any logical guarantees for the result**. From their very inception until now, LLMs are machines that take something as input and produce something as output, and about the output value, it is only known that it will be maximally useful (given the specified input). These limitations are currently mostly uncontrollable. It should be noted that the in-context prompting method (providing all necessary information for the model to answer within the context) reduces the number of LLM hallucinations and improves logical consistency, but does not provide explicit guarantees.
  - **Note**: It should be noted that the above LLM limitations are qualitative architectural limitations and will not be resolved in new LLM "versions" or with an increase in the number of parameters. **Therefore, the aforementioned problems require the development of principal solutions.**
  - **Problem and what can be done**: programming needs guarantees. **Any technical tool needs guarantees**. A "toolkit" with the following properties is needed:
    1. decomposition of a task into the smallest possible elementary tasks + calculation of elementary tasks + inverse synthesis into a final answer. Synthesis requires a higher-level computation and optimization architecture.
    2. searching and providing the LLM with the necessary optimal context
    3. control of responses from the LLM: post-testing, checking logical correctness, checking factual correctness
  - **What currently exists in core-kbt**:
    1. identification and description of elementary tasks in the form of an AI function
    2. providing the LLM with the necessary context through the `elementary` knowledge base
  - **What is planned in core-kbt**:
    1. agent-based computing architecture
    2. methods for optimizing the `elementary` database for the task through "trajectories" ("ktb" - "knowledge base trajectory"), i.e., variants of knowledge bases for further selection of the best "trajectory" through an optimization procedure
    3. integration with frameworks for testing and monitoring (Langfuse, etc.)
    4. integration with IDE for knowledge development
    5. checking logical correctness
    6. checking factual correctness
* - **Description**: For professional use, it is not enough to simply chat with an LLM bot. In addition, as a rule, current "knowledge" needs to be somehow saved for future use and improvement.
  - **Problem and what can be done**: special tools and IDEs are needed for special use.
  - **What currently exists in core-kbt**:
    1. for Obsidian: scripts and templates for integrating core-kbt functionality

### Project Concept

The `core-kbt` project (kbt — Knowledge Base Trajectory) is a Python mini-framework for developing applications based on Large Language Models (LLMs). Its core principle is an approach with a managed Knowledge Base (elementary), where AI agents will, in the future, use and intellectually develop a version-controlled knowledge base (elementary) to perform complex tasks.

#### AI-functions

AI-functions are "tools" that AI agents use to interact with the world and modify the Knowledge Base (Elementary). They are designed as reusable, modular, and "intelligent" components with clearly defined input and output schemas.

There are two ways to implement an AI Function:
1. Jinja2 Template: A prompt template that can be executed by an LLM.
2. Python Module: A Python function that can contain arbitrary logic, including calls to external APIs or other complex operations.

The Flask server provides these functions via a RESTful API, with dynamic compilation, handling authorization and dispatching. This provides extensive opportunities for integrating AI Functions with other systems, for example:
* browser plugins ([chatGPTBox](https://github.com/ChatGPTBox-dev/chatGPTBox))
* n8n-nodes
* plugins for working with knowledge bases, for example, with Obsidian
* other high-level applications in any programming language.

#### Knowledge Base (elementary)

The elementary knowledge base is a structured repository of domain knowledge that agents work with. It is stored as a hierarchy of YAML, JSON, or Turtle files, making it both human-readable and machine-processable.

The entire KB is stored in Git, which provides reliable versioning. Each branch can represent a different state of knowledge, allowing for experimentation and analysis of agent performance.

#### AI Agents

AI Agents are the central actors in the system. Their primary role is to perform tasks by intelligently modifying the Knowledge Base. Each significant change made by an agent leads to a new, qualitatively different state of the Knowledge Base (KB), which is versioned in a separate Git branch. This allows for the creation and evaluation of "knowledge state trajectories."
Currently, the architecture and implementation of the agent subsystem are under development.
Before implementing the agent subsystem, it is necessary to consider: (a) an effective system of "elementary" tasks and queries, and (b) effective methods for working with knowledge bases.

## Tooling for core-kbt

Let's move on to describing the current tooling for core-kbt. This tooling already seems useful, despite the fact that the agent system has not yet been implemented and effective methods for working with knowledge bases have not yet been fully formulated.

### Getting started with core-kbt

1. Clone the repository:
```
git clone https://github.com/ady1981/core-kbt.git
cd core-kbt
```
2. Set environment variable values in the `.env` file, for example for DeepSeek:
```shell
HOST=0.0.0.0
PORT=5001
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-chat
OPENAI_API_KEY=<DEEPSEEK_API_TOKEN>
AI_FUNC_API_TOKEN=<A_SECRET>
```
2. Start the AI function server:
  * via docker:
```shell
./run-gh-docker-image.sh
```
   * via command line:
```shell
./runner.sh -s kbt-core/ai_function_server.py
```
3. Suppose we want to know the capital of Russia. We will use the ready-made AI function `generate`.
Call the AI function with the corresponding input parameters (`target_specification`):
```shell
source .env
curl -X PUT "http://127.0.0.1:5001/ai-func/generate" \  -H "Api-Token: $AI_FUNC_API_TOKEN" \  -H "Content-Type: application/json" \  -H "Accept: application/json" \  -d "{  "target_specification": "target_description: What is Capital of Russia?"}"
```
Response:
```json
{
  "result": {
    "items": [
      {
        "item": "Moscow",
        "reasoning": "The target question asks for the capital of Russia. Based on general knowledge, the capital of Russia is Moscow."
      }
    ],
    "other_notes": "The information retrieval strategy specified no external context knowledge, relying solely on general knowledge to answer the factual question about the capital of Russia."
  }
}
```

### Universal template for a prompt

It is clear that the central theme for effective LLM use is prompt engineering, i.e., approaches to building effective queries to obtain the desired answers.
As is known, LLMs always solve only one problem - generatively-continue-prompt. A general representation with the выделением of different parts for the prompt can be written as follows:
```yaml
LLM_prompt:
  prompt_structure_and_notation_self_specification: []
  target_specification:
  - task_specification
  - target_semantic_specification
  information_retrieval_strategy:
  - context_knowledge_specification:
    - context_knowledge_topic
    - context_knowledge_source:
        - properties
        - content
  - knowledge_sources_selection_strategy
  - context_preparation_strategy
  - contextual_alignment_strategy
  - contextual_memory_strategy
  - ...
  output_generation_strategy:
  - execution_plan_specification
  - task_decomposition_specification
  - knowledge_consolidation_specification
  - evaluation_metrics
  - iteration_and_refinement_strategy
  - examples
  - safety_and_ethics_specification
  - post_generation_verification_specification
  - ...
  output_specification:
  - structure_and_formatting_specification
  - output_constrains_specification
  - output_content_strategy
  - ...
```
The meaning of these parts of the prompt is more or less clear from the name. Additionally, we note the following:
* any `specification` - defines a specification, i.e., unambiguously clear requirements
* any `strategy` - defines a set of policies on how best to achieve the desired result
* if `task_specification` is difficult to define, then `task_description` can be used. Subsequently, the generation result with such a prompt can be compared with the generation result for a prompt with the corresponding `task_specification` defined.
* `target_specification` - defines the specification of the "meaning" of the query and the result
* `information_retrieval_strategy` - defines how to find information to solve the query
* `output_generation_strategy` - defines the strategy for generating the answer to achieve the desired result.

Here is an example for a summarize-prompt in this representation:
```yaml
LLM_prompt:
  target_specification:
  - task_specification: Abstractive summarize
  - target_semantic_specification: Concise
  information_retrieval_strategy:
  - context_knowledge_specification:
      - context_knowledge_source: |
        {{TO_SUMMARIZE_TEXT}}
  - knowledge_sources_selection_strategy: Use only the provided input text.
  - contextual_alignment_strategy: Ensure summary reflects the core meaning of the input.
  output_generation_strategy:
  - focus_on: the central theme
  - execution_plan_specification: Read input, identify key sentences/concepts, synthesize into a short paragraph.
  - task_decomposition_specification: Single step.
  - knowledge_consolidation_specification: Extract and combine main ideas.
  - evaluation_metrics: Conciseness, Fidelity to source.
  - safety_and_ethics_specification: Maintain factual accuracy.
  - post_generation_verification_specification: Check if summary is significantly shorter than the original.
  output_specification:
  - structure_and_formatting_specification: Plain text paragraph.
  - output_constrains_specification: Maximum 3 sentences.
```
It should be noted that the existence of an effective universal template for an LLM prompt means that one can create one conditionally universal AI function through which any task can be set for an LLM. Moreover, LLM prompts can be configured using a universal system of aspects. However, for greater convenience and to improve the efficiency of LLM prompts for specific tasks, it makes sense to create separate AI functions in which input fields can be defined more concretely and, even more importantly, output fields can be defined more concretely in the output JSON-Schema (including to "force" the model to "think" about the generated values).

### Ideas for prompt management

The next question is how to represent these parts of the prompts. Let's suggest a set of ideas:
* for maximum efficiency, we want to arrive at a certain universal prompt management system. A system where, for any task, one would iteratively arrive at the most effective prompt. For this, we will represent all basic specification elements as block-level Markdown properties in the form:
```
[ <aspect_name>.<feature_name>:: <feature_value> ]
```
  (or simply as `<aspect_name>.<feature_name>: <feature_value>`, if this does not create parsing difficulties).
* in core-kbt, the structural format in `output_specification` has already been chosen - it is JSON Schema, which is substituted "under the hood". Therefore, in `output_specification`, we will define other aspects of the response format.

### Variant of basic Templater templates for knowledge development in Obsidian

Let's choose the simplest option for effective generation of new information in Obsidian: the user, working in a specific .md document, selects text in the editor, to which a specific Templater template is applied, which corresponds to a specifically configured AI function. The AI function is executed, and the result is inserted into the current document immediately after the selected text (for further editing or new generation).
In such a scenario, the following input data elements can be used for the AI function:
* selected text to which the AI function should be applied
* file name, which defines the "topic" of the knowledge area in which generation is required
* full content of the current file
* values of aspects for the given task, defined in the Templater template code.
By choosing the necessary information and generating new information through customizable generation templates, "knowledge" described in the current document can be developed.

It should also be noted that if an .md document is configured to use a specific system of inline (block level) attributes suitable for automatic processing, this transforms the document into a full-fledged knowledge base. Knowledge bases of this type can be managed through Obsidian + Dataview plugin or other tools.

We propose the following set of basic templates for knowledge development in Obsidian.

#### Basic templates for item

These templates are applied to selected text, which is considered a single item. Only internal knowledge is used for generation.

| template | Description | Input Data | Result Type |
|---|---|---|---|
| factual_qa | template for answering a factual question | Question | List |
| term_identify | template for identifying a term by description or definition. Inverse function to the function of generating a definition for a term | Description for the term | AnyMarkdown |
| example | template for generating examples for a given description | Group, category, or description | List |
| review | template for generating a review document | Text or code | AnyMarkdown |
| summarize | template for generating a summary document | Text | AnyMarkdown |
| aspected_analyze | template for analyzing text through aspect values | Text or code | PropertyList |
| aspected_rewrite | template for editing text through aspect values | Text or code | WithPropertyMarkdown |

All templates can and should be customized for a more precise solution to a specific problem.
New templates can also be created based on basic ones for new, more narrow tasks.
The result type here is described for general understanding, and what this type means is implied by the name.

#### Basic templates for items

These templates are applied to selected text as a sequence of items.

| template | Description | Input Data | Result Type |
|---|---|---|---|
| difference | template for generating differing aspects for two items | Items to compare (by default, items should be on a separate line) | DifferenceMarkdown |
| common | template for generating common aspects for two items | Items to compare (by default, items should be on a separate line) | PropertyList |
| new_item | template for generating new items for a given sequence | Items | List |
| group | template for generating a group name (or category) for a given sequence | Items | AnyMarkdown |

#### Basic templates for context + item

This template is applied to the selected text, and information from the current active document is used for generation. The question text should be entered at the very end of the active document.

| template | Description | Input Data | Result Type |
|---|---|---|---|
| incontext_qa | template for generating answers to a question based on the current document | 1. Document text. 2. Question about the document text | List |

### Example of installation and use

#### Installation

* install Obsidian and Templater plugin
* install, configure env-parameters and start the AI function server (e.g., via docker)
* configure obsidian-templater-core-kbt for Obsidian Templater:
  - download the [obsidian-templater-core-kbt](https://github.com/ady1981/obsidian-templater-core-kbt) repository into a folder. Let's denote the path to this folder as OBS_CORE_KBT.
  - denote the directory with the working Obsidian vault as KNOWLEDGE
  - to configure templates, you need to:
      * copy the contents of the `$OBS_CORE_KBT/src` folder to the `$KNOWLEDGE/_scripts` folder (or create a link)
      * copy the contents of the `$OBS_CORE_KBT/templates` folder to the `$KNOWLEDGE/_templates` folder (or create a link)
      * in the Templater plugin configuration in Obsidian: in the `User script functions / script files folder location` value, specify `_scripts`
      * in the Templater plugin configuration in Obsidian: in the `Template folder location` value, specify `_templates`

#### Usage examples

##### factual_qa
* create a new document in the Obsidian vault - `geography.md`
* in the document, write the question: "Capital of Russia"
* select the text
* call the custom template via the command in Obsidian: `Templater: Open insert template modal → factual_qa`. After the template is computed, the generation result will be inserted into the active document:
```
Capital of Russia
- The capital of Russia is Moscow.
  - [reference.1:: Well-known geographical fact // internal knowledge]
```

##### difference
* create a new document in the Obsidian vault - `earth science.md`
* in the document, write the items to compare:
```
Weather
Climate
```
* select these items for comparison
* call the `difference` Templater template. After the template is computed, the generation result will be inserted into the active document:
```
# Difference
## Weather

- [**Time scale.Description duration**:: Short-term (hours, days, weeks)]
- [Subject of description.Focus of description:: Specific, instantaneous atmospheric conditions]
- [Variability.Degree of variability:: High (frequent and sharp changes)]

## Climate

- [**Time scale.Description duration**:: Long-term (months, years, decades)]
- [Subject of description.Focus of description:: Statistical characteristics of atmospheric conditions]
- [Variability.Degree of variability:: Low (stable trends)]
```

##### common
* create a new document in the Obsidian vault - `cars.md`
* in the document, write the text to compare:
```
Haval Dargo
Haval H3
```
* select this text and call the `common` Templater template. After the template is computed, the generation result will be inserted into the active document:

```
- [**Platform and chassis.Platform**:: Common modular Haval platform (presumably)]
- [**Powertrain.Engine type**:: Gasoline turbocharged engine]
- [**Powertrain.Transmission type**:: Automatic (likely DCT)]
- [Exterior design.Signature grille style:: Presence of a large, dominant grille]
```

##### review
* create a new document in the Obsidian vault - `history.md`
* in the document, write the text for review:
```
The main reason for the collapse of the Western Roman Empire in 476 AD was the overwhelming military superiority of the Huns, who single-handedly plundered Rome and enthroned Odoacer.
```
* select this text and call the `review` Templater template. After the template is computed, the generation result will be inserted into the active document:
```markdown
# Review
### Assessment: Critical inaccuracy in defining the main cause of collapse

**Analysis:** The statement that the main reason for the collapse of the Western Roman Empire in 476 was "the overwhelming military superiority of the Huns, who single-handedly plundered Rome and enthroned Odoacer" is historically incorrect and overly simplistic...

**Recommendation:** It is necessary to rephrase the reason, recognizing that the Huns (especially under Attila) were a powerful destabilizing factor, but not the sole and direct cause of the 476 collapse...

### Analysis: Mixing cause-and-effect relationships and chronology

**Weakness:** The text incorrectly links "the sack of Rome" (which occurred at different periods, for example, by the Visigoths in 410 and the Vandals in 455) and the enthronement of Odoacer (476) as direct and simultaneous consequences of the Huns' power. The Huns were defeated at the Battle of the Catalaunian Plains (451) and their influence sharply declined after Attila's death (453), long before 476.

**Recommendation:** Separate factors: 1) External pressure (including Huns and subsequent migrations); 2) Internal collapse of administrative and military structure; 3) The event of 476 as a political end, not a military conquest.
### Assessment: Insufficient detail of key events

**Analysis:** The phrase "plundered Rome" is inaccurate in the context of 476...

**Actionable Proposal:** To increase the expert level of the content, it is necessary to replace the generalization with specifics: "...led to the final collapse of imperial power in the West, culminating in the deposition of the last emperor, Romulus Augustulus, by the Germanic chieftain Odoacer in 476."
```

##### aspected_rewrite
* create a new document in the Obsidian vault - `history.md`
* in the document, write the text for modification:
```
The main reason for the collapse of the Western Roman Empire in 476 AD was the overwhelming military superiority of the Huns, who single-handedly plundered Rome and enthroned Odoacer.
```
* select this text and call the `aspected_rewrite` Templater template. After the template is computed, the generation result will be inserted into the active document:
```
A key factor that ended the existence of the Western Roman Empire in 476 AD was the cumulative impact of internal systemic crises and the permanent migratory pressure of Germanic foederati, culminating in the deposition of Romulus Augustulus by Odoacer.
- [Expertness_level.level:: High]
- [Causality_description.accuracy:: Complex systemic failure and external pressure]
```

##### new_item
* create a new document in the Obsidian vault - `general sense.md`
* in the document, write the items:
```
- Friday
- Saturday
- Sunday
- Monday
```
* select this text and call the `new_item` Templater template. After the template is computed, the generation result will be inserted into the active document:
```
- Tuesday
- Wednesday
- Thursday
```
##### group
* Create a document in the Obsidian vault - `general sense.md`
* in the document, write the items:
```
- Friday
- Saturday
- Sunday
- Monday
- Tuesday
- Wednesday
- Thursday
```
* select this text and call the `group` Templater template. After the template is computed, the generation result will be inserted into the active document:
```
Days of the week
```

### Summary

In summary, we will list what could be learned in this article:
* current status of the core-kbt mini-framework
* universal prompt template and the idea of developing an effective prompt through an aspect system
* variant of basic Templater templates for knowledge development in Obsidian
* tutorial on how to configure and use basic templates in Obsidian

Or differently:

#### Working with .md documents to develop knowledge using LLMs

| **Without help** from obsidian-templater-core-kbt and other frameworks ❌| **With help** from obsidian-templater-core-kbt ✅|
|---|---|
| need to create an effective prompt for a specific task. How to create it? | need to select a template for a specific task from the list and configure the values of the required aspects. If there is no template for the task, it can be easily created by copying. The output result can also be easily configured |
| how to ensure that the current prompt is maximally effective for a specific task? What needs to be improved in the prompt? | the result can be improved through the aspect system |
| how to insert answers to some factual question into the current document? | use the `factual_qa` template |
| how to determine which term fits the selected description? | use the `term_identify` template |
| how to find examples for the selected item? 🔥| use the `example` template |
| how to write an expert review for the selected text? 🔥🔥| use the `review` template |
| how to write a summary for the selected text? | use the `summarize` template |
| how to perform an aspect analysis for the selected text? 🔥| use the `aspected_analyze` template |
| how to rewrite selected text, controlling the aspects of the text? 🔥🔥| use the `aspected_rewrite` template |
| how to determine which aspects differentiate the selected items? 🔥🔥| use the `difference` template |
| how to choose the best of two? 🔥🔥| use the `difference` template to perform an aspect comparison for the desired aspects |
| how to determine which aspects the selected items have in common? 🔥🔥| use the `common` template |
| how to find a new element of a set for a selected sequence of elements? 🔥🔥| use the `new_item` template |
| how to find a group name (or category) that unites a selected sequence of elements? 🔥| use the `group` template |
| how to get answers to a selected question based on the current document? | use the `incontext_qa` template |
| how to generate new ideas for concept development? 🔥🔥 | 1: use the `new_item` template for the current set of ideas. Or 2: perform an aspect analysis of current ideas using the `aspected_analyze` template, determine which aspects can be improved, and generate a new idea using `aspected_rewrite`. 3... |

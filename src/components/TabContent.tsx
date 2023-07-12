import React, { useEffect, useState } from "react";
import { styled } from "@storybook/theming";
import { H1, Link, Code } from "@storybook/components";
import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from "openai"
import { useAddonState } from '@storybook/manager-api';
import ReactMarkdown from 'react-markdown'
const configuration = new Configuration({
  apiKey: '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',
});
const openai = new OpenAIApi(configuration);
const TabWrapper = styled.div(({ theme }) => ({
  background: theme.background.content,
  padding: "4rem 20px",
  minHeight: "100vh",
  boxSizing: "border-box",
}));

const TabInner = styled.div({
  maxWidth: 768,
  marginLeft: "auto",
  marginRight: "auto",
});

export interface TabContentProps {
  code: string;
  file: string
}

export const TabContent: React.FC<TabContentProps> = ({file}) => {

  const [resultAi, setResultAi] = useState('')
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    console.log('ZE FILE', file)
    if (file) {
      const [_, rawFileName] = new RegExp(/sourceMappingURL=(.*)/).exec(file);
      
      fetch(rawFileName).then(result => {
        result.json().then(jsFile => {
                    
          const messages = [];
          messages.push(
            { role: ChatCompletionRequestMessageRoleEnum.System, content: `You're a great Javascript software engineers, with a passion of helping junior engineers. You're great in developing React applications an know everything about it. You can explain complex code in an eloborate way that everyone understands it.` }, 
          )
          setLoading(true);
          openai.createChatCompletion({
            model: "gpt-3.5-turbo-16k",
            messages: [
              ...messages,
              { role: ChatCompletionRequestMessageRoleEnum.User, content: `Can you make documentation of the following React component ${jsFile.sourcesContent[0]}, return the result in markdown. With extensive explaination of how to use the component and explaining in text what the component does. Provide a few examples on how to use the component. Provide tips and tricks on how to use the component. Then some useful links regarding the React component. End with a small code review on the component, and how to improve it.` }],
            max_tokens: 3500,
            
          }).then((result) => {
            setResultAi(result.data.choices[0].message.content);
            setLoading(false);
          })
        })
      })
    }

  }, [file])

  return   <TabWrapper>
  <TabInner>
    <H1>Generate my AI docs</H1>
    {isLoading && <span>loading.... takes long....</span>}
    <ReactMarkdown>
      {resultAi}
    </ReactMarkdown>
  </TabInner>
</TabWrapper>
}

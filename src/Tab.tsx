import React, { useState } from "react";
import { useParameter } from "@storybook/manager-api";
import { PARAM_KEY } from "./constants";
import { TabContent } from "./components/TabContent";
import { AddonStore, Combo, useAddonState, useChannel } from "@storybook/manager-api";
import { AddonPanel } from "@storybook/components";
import { ADDON_ID, EVENTS } from "./constants";

import { Provider as ManagerProvider } from '@storybook/manager-api';
import { Location, LocationProvider, useNavigate } from '@storybook/router';
import type { Channel } from '@storybook/channels';
import type { Addon_Types, Addon_Config } from '@storybook/types';
const { FEATURES, CONFIG_TYPE } = global;
import { addons } from '@storybook/manager-api';

import { CHANNEL_CREATED } from '@storybook/core-events';
import { PanelContent } from "./components/PanelContent";


interface TabProps {
  active: boolean;
}


class ReactProvider {
  private addons: AddonStore;

  private channel: Channel;

  /**
   * @deprecated will be removed in 8.0, please use channel instead
   */
  private serverChannel?: Channel;

  constructor() {

    this.channel = {
      on: () => {},
      once: () => {},
      off: () => {},
      emit: () => {},
      addListener: () => {},
      removeListener: () => {},
      isAsync: false,
      sender: '',
      events: [],
      data: {},
      transport: false,
      hasTransport: false,
      last: () => {},
      eventNames: () => [''],

    };
    

    addons.setChannel(this.channel);

    this.channel.emit(CHANNEL_CREATED);

    this.addons = addons;
  
    if (FEATURES?.storyStoreV7 && CONFIG_TYPE === 'DEVELOPMENT') {
      this.serverChannel = this.channel;
      addons.setServerChannel(this.serverChannel);
    }
  }

  getElements(type: Addon_Types) {
    return this.addons.getElements(type);
  }

  getConfig(): Addon_Config {
    return this.addons.getConfig();
  }

  handleAPI(api: unknown) {
    this.addons.loadAddons(api);
  }
}

export const MainPanelContent: React.FC<TabProps> = (props) => {
  // https://storybook.js.org/docs/react/addons/addons-api#useaddonstate
  const [results, setState] = useAddonState(ADDON_ID, {
    danger: [],
    warning: [],
  });

  // https://storybook.js.org/docs/react/addons/addons-api#usechannel
  const emit = useChannel({
    [EVENTS.RESULT]: (newResults) => setState(newResults),
  });
  const navigate = useNavigate();
  console.log(results);
  return (
    <>
    <Location key="location.consumer">
    {(locationData) => (
      <ManagerProvider
        key="manager"
        provider={new ReactProvider()}
        {...locationData}
        navigate={navigate}
        docsOptions={{}}
      >
       {({ state, api }: Combo) => {
            const [file, setFile] = useState('')
            const panelCount = Object.keys(api.getPanels()).length;
            const story = api.getData(state.storyId, state.refId);
            const isLoading = story
              ? !!state.refs[state.refId] && !state.refs[state.refId].previewInitialized
              : !state.previewInitialized;
            //console.log(story, state);
            if (story) {
              fetch(story.importPath).then(file => {
                file.text().then(rawFile => {
                  //console.log(rawFile, story.title, story);
                  //console.log('COMPONENT', component, )
                  const [_, match] = new RegExp(/component:(.*),/).exec(rawFile);
                  const expression = `${match.trim()}(.*);`
                  //console.log(expression);
                  //console.log("MATCH", match);
                  //console.log("rawFile", rawFile);
                  const [__, path] = new RegExp(expression).exec(rawFile);

                  // const [_2, importFile] = new RegExp(expression).exec(rawFile);
                  //console.log('fileImport', path)
                  const fileImportPrune = path.replace('}', '').replace('from', '').trim();
                  //console.log('PRUNE', `${fileImportPrune.substring(1).replace('%22', '').replace("\"", '')}`);
                  
                  fetch(`${fileImportPrune.substring(1).replace("\"", '')}?inline`).then(file => {
                    file.text().then(text => setFile(text));
                  });
                })
                
              })
      
            }
      
            return (
              
              <TabContent
                file={file}
                code={undefined}
              />
            
            );
          }}
    </ManagerProvider>
    )}
    </Location>
    </>

  );
};

export const Tab: React.FC<TabProps> = ({ active }) => {
  // https://storybook.js.org/docs/react/addons/addons-api#useparameter
  const paramData = useParameter<string>(PARAM_KEY, "");
  return active ? <LocationProvider><MainPanelContent active={active} /></LocationProvider> : null;
};

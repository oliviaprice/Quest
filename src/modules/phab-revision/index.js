import useSWR from "swr";
import React from "react";
import { Time } from "../../components/time";
import qs from "qs";
import { PaginatedSearchResults } from "../../components/search-results";
import { ExternalLink } from "../../components/external-link";
import logo from "./logo.svg";

const revisionSearchFetcher = (token) => async (url, searchData, cursor) => {
  const res = await fetch(`${url}/api/differential.revision.search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-type": "application/x-www-form-urlencoded",
    },
    body: qs.stringify({
      "api.token": token,
      constraints: { query: searchData.input },
      limit: 5,
      after: cursor,
    }),
  });

  return res.json();
};

function RevisionResultItem({ url, item }) {
  const { fields, id } = item;
  return (
    <>
      <p>
        <ExternalLink href={`${url}/D${id}`}>D{id}</ExternalLink> {fields.title}
      </p>
      <p>
        {fields.summary.length > 200 ? fields.summary.substring(0, 200) + "..." : fields.summary}
      </p>
      <p>
        Last updated <Time seconds={fields.dateModified} />
      </p>
    </>
  );
}

function getRevisionPage(url, token, searchData) {
  return (wrapper) => ({ offset: cursor = null, withSWR }) => {
    const { data, error } = withSWR(
      useSWR([url, searchData, cursor], revisionSearchFetcher(token))
    );

    if (error) {
      return wrapper({ error, item: null });
    }

    if (!data?.result?.data) {
      return wrapper({ item: null });
    }

    return data?.result.data.map((item) =>
      wrapper({
        key: item.id,
        component: <RevisionResultItem url={url} item={item} />,
        item,
      })
    );
  };
}

export default function PaperSearchResults({ searchData = {}, configuration, searchViewState }) {
  const { url, token } = configuration.get();

  return (
    <PaginatedSearchResults
      searchViewState={searchViewState}
      searchData={searchData}
      logo={logo}
      configuration={configuration}
      deps={[token]}
      pageFunc={getRevisionPage(url, token, searchData)}
      computeNextOffset={({ data }) =>
        data?.result?.cursor?.after ? data?.result?.cursor?.after : null
      }
    />
  );
}

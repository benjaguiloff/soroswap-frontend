import { getToken } from './utils';
import { isAddress } from 'helpers/address';
import { SorobanContextType, useSorobanReact } from '@soroban-react/core';
import { TokenMapType } from 'interfaces';
import { useAllTokens } from './useAllTokens';
import useSWRImmutable from 'swr/immutable';

export const findToken = async (
  tokenAddress: string | undefined,
  tokensAsMap: TokenMapType,
  sorobanContext: SorobanContextType,
) => {
  if (!tokenAddress || tokenAddress === '') return undefined;

  const formattedAddress = isAddress(tokenAddress);
  if (!formattedAddress) return undefined;

  const fromMap = tokensAsMap[formattedAddress];

  if (fromMap) return fromMap;

  const token = await getToken(sorobanContext, formattedAddress);

  if (!token?.name || !token?.symbol) return undefined;

  return token;
};

//Returns token from map (user added + api) or network
export function useToken(tokenAddress: string | undefined) {
  const sorobanContext = useSorobanReact();

  const { tokensAsMap } = useAllTokens();

  const { data, isLoading, error } = useSWRImmutable(
    ['token', tokenAddress, tokensAsMap, sorobanContext],
    ([key, tokenAddress, tokensAsMap, sorobanContext]) =>
      findToken(tokenAddress, tokensAsMap, sorobanContext),
  );

  return {
    token: data,
    isLoading,
    isError: error,
  };
}

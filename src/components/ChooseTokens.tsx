import * as React from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import Box from "@mui/material/Box";
import CardContent from "@mui/material/CardContent";
import { Checkbox, Typography } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import { useTokens } from "../hooks/useTokens";
import { useReservesBigNumber } from "../hooks/useReserves";

import { useSorobanReact } from "@soroban-react/core";
import TokensDropdown from "./TokensDropwndown";
import { SorobanContextType } from "@soroban-react/core";
import { TokenType } from "../interfaces/tokens";
import { DepositButton } from "./buttons/DepositButton";
import BigNumber from "bignumber.js";
import { PairBalance } from "./PairBalance";
import { useAllPairsFromTokens } from "../hooks/usePairExist";
import calculatePoolTokenOptimalAmount from "../functions/calculatePoolTokenOptimalAmount";
import { SwapButton } from "./buttons/SwapButton";
import { ProvideLiquidityPair } from "./ProvideLiquidityPair";
import {ProvideSwapPair} from "./ProvideSwapPair";
import { CreatePairButton } from "./buttons/CreatePairButton";


export function ChooseTokens({ isLiquidity }: { isLiquidity: boolean }) {
  // If isLiquidity == false => Means we are in Swap
  const sorobanContext = useSorobanReact();
  const tokens = useTokens(sorobanContext);

  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {isLiquidity ? "Provide Liquidity" : "Swap"}
        </Typography>
        {sorobanContext.address && tokens?.length > 0 ? (
          <ChooseTokensWallet
            sorobanContext={sorobanContext}
            tokens={tokens}
            isLiquidity={isLiquidity}
          />
        ) : (
          <div>Connect your Wallet</div>
        )}
      </CardContent>
    </Card>
  );
}

function ChooseTokensWallet({
  sorobanContext,
  tokens,
  isLiquidity,
}: {
  sorobanContext: SorobanContextType;
  tokens: TokenType[];
  isLiquidity: boolean;
}) {
  const allPairs = useAllPairsFromTokens(tokens, sorobanContext);

  const [inputToken, setInputToken] = React.useState<TokenType>(tokens[0]);
  const [outputToken, setOutputToken] = React.useState<TokenType | null>(null);
  const [inputTokenAmount, setInputTokenAmount] = React.useState(0);
  const [outputTokenAmount, setOutputTokenAmount] = React.useState(0);
  const [pairExist, setPairExist] = React.useState<boolean | undefined>(
    undefined,
  );
  const [pairAddress, setPairAddress] = React.useState<string | undefined>(
    undefined,
  );

  function getPairExists(token0: any, token1: any, allPairs: any) {
    return allPairs.some((pair: any) => {
      return (
        (pair.token_0 === token0 && pair.token_1 === token1) ||
        (pair.token_1 === token1 && pair.token_0 === token0)
      );
    });
  }

  React.useEffect(() => {
    // Code to run when the component mounts or specific dependencies change
    setPairExist(getPairExists(inputToken, outputToken, allPairs));

    let selectedPair = allPairs.find((pair: any) => {
      return (
        pair.token_0.token_address === inputToken.token_address &&
        pair.token_1.token_address === outputToken?.token_address
      );
    });
    if (selectedPair) setPairAddress(selectedPair.pair_address);

    console.log(
      "🚀 ~ file: ChooseTokens.tsx:88 ~ React.useEffect ~ getPairExists(inputToken, outputToken, allPairs):",
      getPairExists(inputToken, outputToken, allPairs),
    );
  }, [inputToken, outputToken, allPairs]); // Dependencies array

  const handleInputTokenChange = (
    event: React.ChangeEvent<{ value: string }>,
  ) => {
    const token = tokens.find(
      (token) => token.token_symbol === event.target.value,
    );
    setInputToken(token!);
    setInputTokenAmount(0);
    setOutputTokenAmount(0);
  };
  const handleOutputTokenChange = (
    event: React.ChangeEvent<{ value: string }>,
  ) => {
    const token =
      tokens.find((token) => token.token_symbol === event.target.value) ?? null;
    setOutputToken(token);
    setInputTokenAmount(0);
    setOutputTokenAmount(0);
  };

  const reserves = useReservesBigNumber(pairAddress??"", sorobanContext);

  const handleInputTokenAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setInputTokenAmount(event.target.valueAsNumber);
    if (isLiquidity && reserves.reserve0.isGreaterThan(0) && reserves.reserve1.isGreaterThan(0)) {
      let optimalLiquidityToken1Amount = calculatePoolTokenOptimalAmount(
        BigNumber(event.target.valueAsNumber).shiftedBy(7),
        reserves.reserve0,
        reserves.reserve1,
      );
      setOutputTokenAmount(optimalLiquidityToken1Amount.decimalPlaces(0).shiftedBy(-7).toNumber());
    }
  };

  const handleOutputTokenAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setOutputTokenAmount(event.target.valueAsNumber);
    let optimalLiquidityToken0Amount = calculatePoolTokenOptimalAmount(
      BigNumber(event.target.valueAsNumber).shiftedBy(7),
      reserves.reserve1,
      reserves.reserve0,
    );
    if (isLiquidity && reserves.reserve0.isGreaterThan(0) && reserves.reserve1.isGreaterThan(0)) {
      setInputTokenAmount(optimalLiquidityToken0Amount.decimalPlaces(0).shiftedBy(-7).toNumber());
    }
  };

  return (
    <div>
      <Box sx={{ display: "flex", flexWrap: "wrap" }}>
        <div>
          <TokensDropdown
            tokens={tokens.filter((token) => token.token_symbol !== outputToken?.token_symbol)}
            onChange={handleInputTokenChange}
            title={"Input token"}
          />
          {pairExist ? (
            <FormControl sx={{ m: 1, width: "25ch" }}>
              <InputLabel htmlFor="outlined-adornment-amount">
                Amount Input
              </InputLabel>

              <OutlinedInput
                type="number"
                id="outlined-adornment-amount"
                startAdornment={
                  <InputAdornment position="start">
                    {inputToken?.token_name}
                  </InputAdornment>
                }
                value={inputTokenAmount}
                label={"Amount"}
                onChange={handleInputTokenAmountChange}
              />
            </FormControl>
          ) : null}
        </div>
        <div>
          <TokensDropdown
            tokens={!isLiquidity?tokens.filter((token) => getPairExists(inputToken, token, allPairs)):tokens.filter((token) => token.token_symbol !== inputToken?.token_symbol)}
            onChange={handleOutputTokenChange}
            title={"Output token"}
            inputToken={inputToken}
          />
          {pairExist ? (
            <FormControl>
              <InputLabel htmlFor="outlined-adornment-amount">
                Amount Output
              </InputLabel>
              <OutlinedInput
                type="number"
                id="outlined-adornment-amount"
                startAdornment={
                  <InputAdornment position="start">
                    {outputToken?.token_name}
                  </InputAdornment>
                }
                value={outputTokenAmount}
                label="Amount"
                onChange={handleOutputTokenAmountChange}
              />
            </FormControl>
          ) : null}
        </div>
        {isLiquidity && pairExist && outputToken && pairAddress && (
            <ProvideLiquidityPair
              sorobanContext={sorobanContext}
              pairAddress={pairAddress}
              inputTokenAmount={inputTokenAmount}
              outputTokenAmount={outputTokenAmount}
              setInputTokenAmount={setInputTokenAmount}
              setOutputTokenAmount={setOutputTokenAmount}
              isLiquidity={isLiquidity}
            />
          )}
        {!isLiquidity && pairExist && outputToken && pairAddress &&
          <ProvideSwapPair
            sorobanContext={sorobanContext}
            pairAddress={pairAddress}
            inputToken={inputToken}
            inputTokenAmount={inputTokenAmount}
            outputTokenAmount={outputTokenAmount}
            changeOutput={setOutputTokenAmount}
            isLiquidity={isLiquidity}
          />
        }
        {outputToken && inputToken && !pairExist && <div>
            <p>Pair does not exist</p>
            <CreatePairButton
              token0={inputToken}
              token1={outputToken}
              sorobanContext={sorobanContext}
            /></div> 
        }
    
      </Box>
    </div>
  );
}

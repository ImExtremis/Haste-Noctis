%% Copyright (C) 2026 Noctis Contributors
%%
%% This file is part of Noctis.
%%
%% Noctis is free software: you can redistribute it and/or modify
%% it under the terms of the GNU Affero General Public License as published by
%% the Free Software Foundation, either version 3 of the License, or
%% (at your option) any later version.
%%
%% Noctis is distributed in the hope that it will be useful,
%% but WITHOUT ANY WARRANTY; without even the implied warranty of
%% MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
%% GNU Affero General Public License for more details.
%%
%% You should have received a copy of the GNU Affero General Public License
%% along with Noctis. If not, see <https://www.gnu.org/licenses/>.

-module(noctis_relay_health_handler).
-behaviour(cowboy_handler).

-export([init/2]).

-spec init(cowboy_req:req(), term()) -> {ok, cowboy_req:req(), term()}.
init(Req, State) ->
    Response = json:encode(#{
        <<"status">> => <<"ok">>,
        <<"service">> => <<"noctis-relay">>
    }),
    Req2 = cowboy_req:reply(200, #{
        <<"content-type">> => <<"application/json">>
    }, Response, Req),
    {ok, Req2, State}.

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

-module(noctis_gateway_app).
-behaviour(application).
-export([start/2, stop/1]).

-spec start(application:start_type(), term()) -> {ok, pid()} | {error, term()}.
start(_StartType, _StartArgs) ->
    noctis_gateway_env:load(),
    otel_metrics:init(),
    passive_sync_registry:init(),
    guild_counts_cache:init(),
    {ok, Pid} = noctis_gateway_sup:start_link(),
    Port = noctis_gateway_env:get(port),
    Dispatch = cowboy_router:compile([
        {'_', [
            {<<"/_health">>, health_handler, []},
            {<<"/_admin/reload">>, hot_reload_handler, []},
            {<<"/">>, gateway_handler, []}
        ]}
    ]),
    {ok, _} = cowboy:start_clear(http, [{port, Port}], #{
        env => #{dispatch => Dispatch},
        max_frame_size => 4096
    }),
    {ok, Pid}.

-spec stop(term()) -> ok.
stop(_State) ->
    ok.

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

-module(noctis_relay_sup).
-behaviour(supervisor).
-export([start_link/0, init/1]).

-spec start_link() -> {ok, pid()} | {error, term()}.
start_link() ->
    supervisor:start_link({local, ?MODULE}, ?MODULE, []).

-spec init([]) -> {ok, {supervisor:sup_flags(), [supervisor:child_spec()]}}.
init([]) ->
    SupFlags = #{
        strategy => one_for_one,
        intensity => 5,
        period => 10
    },
    Children = [
        child_spec(noctis_relay_connection_manager, noctis_relay_connection_manager)
    ],
    {ok, {SupFlags, Children}}.

-spec child_spec(atom(), module()) -> supervisor:child_spec().
child_spec(Id, Module) ->
    #{
        id => Id,
        start => {Module, start_link, []},
        restart => permanent,
        shutdown => 5000,
        type => worker
    }.
